"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanySubmission, getUniqueCompanySlug } from "@/lib/data";
import { companySlug } from "@/lib/slug";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug } from "@/lib/trade-taxonomy";
import type { CompanySubmission } from "@/lib/types";

type ApprovedCompany = {
  id: string;
  slug: string;
};

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/submissions?error=missing-submission-id");

  const publicVisible = formData.get("public_visible") === "on";

  try {
    const submission = await getCompanySubmission(id);
    if (submission.status === "approved") {
      throw new Error("Diese Einreichung wurde bereits freigegeben.");
    }

    const company = await promoteSubmissionToCompany(submission, { publicVisible });

    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${id}`);
    revalidatePath("/suche");
    revalidatePath("/");
    revalidatePath(`/firma/${company.slug}`);

    redirect(`/admin/submissions/${id}?approved=${company.slug}`);
  } catch (error) {
    const message = readableApprovalError(error);
    redirect(`/admin/submissions/${id}?error=${encodeURIComponent(message)}`);
  }
}

async function promoteSubmissionToCompany(
  submission: CompanySubmission,
  options: { publicVisible: boolean },
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const claimCompanyId = claimCompanyIdFromSource(submission.source);
  const tradeSlug = canonicalTradeSlug(submission.primary_trade);
  const { data: trade, error: tradeError } = await supabase.from("trades").select("id").eq("slug", tradeSlug).single();

  if (tradeError || !trade) {
    throw tradeError || new Error(`Gewerk fehlt in Supabase: ${tradeSlug}`);
  }

  const updateOrInsert = companyPayload(submission, trade.id, options.publicVisible);
  const company = claimCompanyId
    ? await updateClaimedCompany(claimCompanyId, updateOrInsert)
    : await createSubmittedCompany(submission, updateOrInsert);

  const { error: submissionError } = await supabase
    .from("company_submissions")
    .update({ status: "approved" })
    .eq("id", submission.id)
    .neq("status", "approved");
  if (submissionError) throw submissionError;

  await Promise.allSettled([
    upsertPrimaryCompanyTrade(company.id, trade.id, submission),
    insertSubmissionSource(company.id, submission),
  ]);

  return company;
}

function companyPayload(submission: CompanySubmission, tradeId: string, publicVisible: boolean) {
  return {
    trade_id: tradeId,
    description: companyDescription(submission),
    contact_name: [submission.contact_first_name, submission.contact_last_name].filter(Boolean).join(" ") || null,
    email: submission.email,
    phone: submission.phone,
    website_url: normalizeSubmissionWebsite(submission.website),
    street: [submission.street, submission.house_number].filter(Boolean).join(" ") || null,
    city: submission.city,
    postal_code: submission.postal_code,
    latitude: 0,
    longitude: 0,
    claim_status: "claimed",
    verified: false,
    public_visible: publicVisible,
    logo_url: submission.logo_url || null,
  };
}

async function updateClaimedCompany(
  companyId: string,
  payload: ReturnType<typeof companyPayload>,
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("companies").update(payload).eq("id", companyId).select("id, slug").single();
  if (error || !data) throw error || new Error("Bestehender Betriebseintrag konnte nicht aktualisiert werden.");
  return data;
}

async function createSubmittedCompany(
  submission: CompanySubmission,
  payload: ReturnType<typeof companyPayload>,
): Promise<ApprovedCompany> {
  const supabase = getSupabaseAdmin();
  const slug = await getUniqueCompanySlug(companySlug(submission.company_name, submission.postal_code, submission.city));
  const { data, error } = await supabase
    .from("companies")
    .insert({
      ...payload,
      name: submission.company_name,
      slug,
    })
    .select("id, slug")
    .single();

  if (error || !data) throw error || new Error("Betriebseintrag konnte nicht angelegt werden.");
  return data;
}

async function upsertPrimaryCompanyTrade(companyId: string, tradeId: string, submission: CompanySubmission) {
  const supabase = getSupabaseAdmin();
  const row = {
    company_id: companyId,
    trade_id: tradeId,
    confidence_score: 100,
    source: "admin-submission-approval",
    evidence: [submission.primary_trade, ...submission.selected_services].filter(Boolean).join(", ") || null,
    status: "admin_confirmed",
    visibility_level: "basis_public",
  };

  const { error } = await supabase.from("company_trades").upsert(row, { onConflict: "company_id,trade_id" });
  if (!error) return;

  await supabase
    .from("company_trades")
    .upsert(
      {
        company_id: companyId,
        trade_id: tradeId,
        confidence_score: 100,
        source: "admin-submission-approval",
        evidence: row.evidence,
      },
      { onConflict: "company_id,trade_id" },
    );
}

async function insertSubmissionSource(companyId: string, submission: CompanySubmission) {
  const supabase = getSupabaseAdmin();
  await supabase.from("company_sources").insert({
    company_id: companyId,
    source_type: "business_submission",
    source_url: null,
    title: "Betriebseintrag",
    snippet: `${submission.company_name} hat den Betriebseintrag eingereicht.`,
    content: JSON.stringify({
      submission_id: submission.id,
      logo_uploaded: Boolean(submission.logo_url),
      profile_image_uploaded: Boolean(submission.profile_image_url),
      profile_image_publication: "not_auto_published",
    }),
  });
}

function companyDescription(submission: CompanySubmission) {
  return [
    submission.short_description,
    submission.description,
    submission.selected_services.length ? `Leistungen: ${submission.selected_services.join(", ")}` : "",
    submission.service_regions.length ? `Tätigkeitsgebiet: ${submission.service_regions.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function claimCompanyIdFromSource(source: string) {
  const match = source.match(/^claim:([0-9a-f-]{36})$/i);
  return match?.[1] || null;
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readableApprovalError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Der Betrieb konnte nicht freigegeben werden. Die Einreichung bleibt im Review.";
}
