"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

type CoverageApprovalAction = "accept_regional_candidate" | "delete_regional_candidate";

const actionConfig: Record<
  CoverageApprovalAction,
  {
    actionType: "publish_company" | "delete_data";
    riskLevel: "high" | "critical";
    title: string;
    description: string;
  }
> = {
  accept_regional_candidate: {
    actionType: "publish_company",
    riskLevel: "high",
    title: "Regionalen Kandidaten als Basis-Eintrag anlegen",
    description: "Freigabeanforderung fuer die manuelle Uebernahme eines Coverage-Kandidaten als oeffentlichen Basis-Eintrag.",
  },
  delete_regional_candidate: {
    actionType: "delete_data",
    riskLevel: "critical",
    title: "Regionalen Kandidaten loeschen",
    description: "Freigabeanforderung fuer das Loeschen eines Coverage-Kandidaten. Ohne separate Ausfuehrung wird nichts geloescht.",
  },
};

export async function requestAcceptRegionalCandidateApproval(formData: FormData) {
  await requestRegionalCandidateApproval(formData, "accept_regional_candidate");
}

export async function requestDeleteRegionalCandidateApproval(formData: FormData) {
  await requestRegionalCandidateApproval(formData, "delete_regional_candidate");
}

async function requestRegionalCandidateApproval(formData: FormData, requestedAction: CoverageApprovalAction) {
  const candidateId = getFormString(formData, "id");
  if (!candidateId) return;

  const supabase = getSupabaseAdmin();
  const { data: candidate, error } = await supabase
    .from("company_candidates")
    .select("id,name,city,postal_code,street,possible_trade,possible_website,phone,email,source_type,source_url,status,overall_score,identity_confidence,trade_confidence,duplicate_of_company_id,raw_evidence")
    .eq("id", candidateId)
    .single();
  if (error || !candidate) throw error || new Error("Kandidat wurde nicht gefunden.");

  if (requestedAction === "accept_regional_candidate" && !isPublishReadyCandidate(candidate)) {
    throw new Error("Dieser Kandidat ist noch nicht publikationsreif. Bitte Website, Identität, Gewerk und Dublettenstatus prüfen.");
  }
  if (requestedAction === "delete_regional_candidate" && candidate.status === "promoted") {
    throw new Error("Ein bereits übernommener Kandidat darf nicht über diesen Review-Pfad gelöscht werden.");
  }

  const config = actionConfig[requestedAction];
  const payload = {
    requested_action: requestedAction,
    source_table: "company_candidates",
    source_id: candidate.id,
    dry_run: true,
    execution_built: false,
    candidate_snapshot: candidate,
    requested_fields: {
      name: getFormString(formData, "name") || candidate.name,
      city: nullableFormString(formData, "city") || candidate.city,
      postal_code: nullableFormString(formData, "postal_code") || candidate.postal_code,
      street: nullableFormString(formData, "street") || candidate.street,
      possible_trade: nullableFormString(formData, "possible_trade") || candidate.possible_trade,
      possible_website: nullableFormString(formData, "possible_website") || candidate.possible_website,
      phone: nullableFormString(formData, "phone") || candidate.phone,
      email: nullableFormString(formData, "email") || candidate.email,
    },
    guardrails: {
      creates_company: false,
      deletes_candidate: false,
      sends_email: false,
      changes_claim_status: false,
      changes_verification_status: false,
      requires_founder_execution_approval: true,
    },
  };

  const { data: existing, error: existingError } = await supabase
    .from("agent_approvals")
    .select("id")
    .eq("agent_id", "regional-coverage-agent")
    .eq("action_type", config.actionType)
    .eq("status", "pending")
    .contains("proposed_payload", { source_id: candidate.id, requested_action: requestedAction })
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.[0]?.id) {
    revalidatePath("/admin/coverage");
    revalidatePath("/admin/agents");
    return;
  }

  const { error: insertError } = await supabase.from("agent_approvals").insert({
    agent_id: "regional-coverage-agent",
    action_type: config.actionType,
    risk_level: config.riskLevel,
    title: `${config.title}: ${candidate.name}`,
    description: [
      config.description,
      `Kandidat: ${candidate.name}`,
      candidate.city || candidate.postal_code ? `Ort: ${[candidate.postal_code, candidate.city].filter(Boolean).join(" ")}` : "",
      "Diese Anfrage fuehrt keine Folgeaktion aus.",
    ]
      .filter(Boolean)
      .join("\n"),
    proposed_payload: payload,
    status: "pending",
    requested_by: "gewerkeliste-os",
  });
  if (insertError) throw insertError;

  revalidatePath("/admin/coverage");
  revalidatePath("/admin/agents");
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value ? value : null;
}

function isPublishReadyCandidate(candidate: {
  status?: string | null;
  possible_website?: string | null;
  source_type?: string | null;
  overall_score?: number | null;
  identity_confidence?: number | null;
  trade_confidence?: number | null;
  duplicate_of_company_id?: string | null;
}) {
  return Boolean(
    candidate.status === "ready_for_publish" &&
      candidate.possible_website &&
      candidate.source_type === "official_website" &&
      (candidate.overall_score || 0) >= 90 &&
      (candidate.identity_confidence || 0) >= 75 &&
      (candidate.trade_confidence || 0) >= 75 &&
      !candidate.duplicate_of_company_id,
  );
}
