"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CompanyFormState, ImportReport } from "@/lib/types";
import { companySlug, slugify } from "@/lib/slug";
import { getCompany, getCompanySubmission, getResearchCandidate, getUniqueCompanySlug } from "@/lib/data";
import { tradeTaxonomy } from "@/lib/trade-taxonomy";
import {
  claimSchema,
  csvCompanySchema,
  flattenZodErrors,
  parseBusinessSubmissionForm,
  parseCompanyForm,
  parseTradeName,
} from "@/lib/validation";

export async function createCompany(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const parsed = parseCompanyForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const slug = await getUniqueCompanySlug(companySlug(input.name, input.postal_code, input.city));
  const { error } = await supabase.from("companies").insert({
    ...input,
    slug,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateCompany(
  id: string,
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = parseCompanyForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const slug = await getUniqueCompanySlug(companySlug(input.name, input.postal_code, input.city), id);
  const { error } = await supabase
    .from("companies")
    .update({
      ...input,
      slug,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function submitClaim(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const parsed = claimSchema.safeParse({
    company_id: String(formData.get("company_id") || ""),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    message: String(formData.get("message") || ""),
    support_contribution: String(formData.get("support_contribution") || "none"),
    support_custom_amount: String(formData.get("support_custom_amount") || ""),
    support_invoice_requested: formData.get("support_invoice_requested") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bitte pruefe die markierten Felder.",
      fieldErrors: flattenZodErrors(parsed.error),
    };
  }

  const supabase = getSupabaseAdmin();
  const { support_contribution, support_custom_amount, support_invoice_requested, ...claim } = parsed.data;
  const supportSummary = formatSupportContribution(
    support_contribution,
    support_custom_amount,
    support_invoice_requested,
  );
  const { error } = await supabase.from("company_claims").insert({
    ...claim,
    message: `${claim.message}\n\n---\n${supportSummary}`,
  });
  if (error) return { ok: false, message: error.message };

  const company = await getCompany(parsed.data.company_id);
  const companyTradeSlug = company.trades?.slug || slugify(company.trades?.name || "fachbetrieb");
  const { error: submissionError } = await supabase.from("company_submissions").insert({
    status: "submitted",
    company_name: company.name,
    legal_form: null,
    website: company.website_url,
    phone: company.phone,
    email: claim.email,
    contact_email: claim.email,
    contact_first_name: claim.name,
    contact_last_name: null,
    contact_role: "Eintragsübernahme",
    contact_person_email: claim.email,
    contact_person_phone: claim.phone,
    street: company.street,
    house_number: null,
    postal_code: company.postal_code,
    city: company.city,
    region: null,
    country: "Deutschland",
    primary_trade: companyTradeSlug,
    secondary_trades: [],
    selected_services: [],
    specializations: [],
    service_radius_km: 50,
    service_regions: [company.city],
    postal_codes: [company.postal_code],
    service_countries: ["Deutschland"],
    short_description: company.description.slice(0, 240) || `${company.trades?.name || "Fachbetrieb"} in ${company.city}`,
    description: `Claim-Anfrage für bestehenden Betriebseintrag.\n\n${claim.message}\n\n${supportSummary}`,
    references_text: `Bestehende Firmen-ID: ${company.id}`,
    memberships: [],
    certificates: [],
    manufacturer_certificates: [],
    wants_founder_verification: true,
    wants_support_contribution: support_contribution !== "none",
    support_contribution_amount:
      support_contribution === "none"
        ? null
        : support_contribution === "custom"
          ? support_custom_amount
          : Number(support_contribution),
    support_invoice_requested,
    consent_authorized: false,
    consent_data_correct: false,
    consent_privacy: true,
    source: `claim:${company.id}`,
  });
  if (submissionError) return { ok: false, message: submissionError.message };

  await supabase.from("companies").update({ claim_status: "pending" }).eq("id", parsed.data.company_id).neq("claim_status", "claimed");

  revalidatePath("/");
  revalidatePath("/suche");
  revalidatePath("/admin/claims");
  revalidatePath("/admin/submissions");
  return { ok: true, message: "Anfrage wurde gespeichert. Es wurde keine Zahlung ausgelöst." };
}

export async function submitBusinessEntry(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = parseBusinessSubmissionForm(formData);
  if (parsed.state) return parsed.state;

  const input = parsed.data;
  if (!input) return { ok: false, message: "Ungueltige Eingabe." };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_submissions")
    .insert({
      status: "submitted",
      company_name: input.companyName,
      legal_form: input.legalForm,
      website: input.website,
      phone: input.phone,
      email: input.email,
      contact_email: input.contactEmail,
      contact_first_name: input.contactFirstName,
      contact_last_name: input.contactLastName,
      contact_role: input.contactRole,
      contact_person_email: input.contactPersonEmail,
      contact_person_phone: input.contactPersonPhone,
      street: input.street,
      house_number: input.houseNumber,
      postal_code: input.postalCode,
      city: input.city,
      region: input.region,
      country: input.country,
      primary_trade: input.primaryTrade,
      secondary_trades: input.secondaryTrades,
      selected_services: input.selectedServices,
      specializations: input.additionalSpecializations
        ? [...input.specializations, input.additionalSpecializations]
        : input.specializations,
      service_radius_km: input.serviceRadiusKm,
      service_regions: input.serviceRegions,
      postal_codes: input.postalCodes,
      service_countries: input.serviceCountries,
      short_description: input.shortDescription,
      description: input.description,
      references_text: input.referencesText,
      memberships: input.memberships,
      certificates: input.certificates,
      manufacturer_certificates: input.manufacturerCertificates,
      wants_founder_verification: input.wantsFounderVerification,
      wants_support_contribution: input.supportContribution !== "none",
      support_contribution_amount:
        input.supportContribution === "none"
          ? null
          : input.supportContribution === "custom"
            ? input.supportCustomAmount
            : Number(input.supportContribution),
      support_invoice_requested: input.supportInvoiceRequested,
      consent_authorized: input.consentAuthorized,
      consent_data_correct: input.consentDataCorrect,
      consent_privacy: input.consentPrivacy,
      source: "betrieb-eintragen",
    })
    .select("id")
    .single();

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("company_submissions");
    return {
      ok: false,
      message: missingTable
        ? "Die Einreichungstabelle ist noch nicht in Supabase angelegt. Die Migration liegt im Projekt bereit."
        : error.message,
    };
  }

  revalidatePath("/admin/companies");
  return {
    ok: true,
    message:
      "Vielen Dank. Ihr Betriebseintrag wurde eingereicht. Wir pruefen die Angaben und melden uns, falls Rueckfragen bestehen.",
    fieldErrors: data?.id ? { submissionId: String(data.id) } : undefined,
  };
}

function formatSupportContribution(contribution: "none" | "49" | "99" | "199" | "custom", customAmount: number | null, invoiceRequested: boolean) {
  const amount =
    contribution === "none"
      ? "Ohne freiwilligen Aufbau-Beitrag"
      : contribution === "custom"
        ? `${customAmount || 0} EUR freiwilliger Aufbau-Beitrag`
        : `${contribution} EUR freiwilliger Aufbau-Beitrag`;

  return [
    "Gründungsphase: Verifizierung ohne Gebühr",
    `Unterstützungsoption: ${amount}`,
    `Rechnung auf Wunsch: ${invoiceRequested ? "ja" : "nein"}`,
    "Hinweis: Der freiwillige Aufbau-Beitrag hat keinen Einfluss auf Prüfung, Darstellung oder Verifizierung des Eintrags.",
    "Zahlungsstatus: keine Zahlung ausgelöst",
  ].join("\n");
}

export async function approveClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id") || "");
  const companyId = String(formData.get("company_id") || "");
  if (!claimId || !companyId) return;

  const supabase = getSupabaseAdmin();
  const { error: companyError } = await supabase.from("companies").update({ claim_status: "claimed" }).eq("id", companyId);
  if (companyError) throw companyError;

  const { error: claimError } = await supabase
    .from("company_claims")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", claimId);
  if (claimError) throw claimError;

  revalidatePath("/admin/claims");
  revalidatePath("/");
  revalidatePath("/suche");
}

export async function rejectClaim(formData: FormData) {
  const claimId = String(formData.get("claim_id") || "");
  if (!claimId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("company_claims")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw error;

  revalidatePath("/admin/claims");
}

export async function setSubmissionStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = String(formData.get("admin_notes") || "").trim();
  if (!id || !["submitted", "in_review", "needs_info", "approved", "rejected"].includes(status)) return;

  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = { status };
  if (adminNotes) update.admin_notes = adminNotes;
  const { error } = await supabase.from("company_submissions").update(update).eq("id", id);

  if (error && "admin_notes" in update) {
    const { error: fallbackError } = await supabase.from("company_submissions").update({ status }).eq("id", id);
    if (fallbackError) throw fallbackError;
  } else if (error) {
    throw error;
  }

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

export async function updateSubmission(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const update = {
    company_name: getFormString(formData, "company_name"),
    legal_form: nullableFormString(formData, "legal_form"),
    website: nullableFormString(formData, "website"),
    phone: nullableFormString(formData, "phone"),
    email: getFormString(formData, "email"),
    street: nullableFormString(formData, "street"),
    house_number: nullableFormString(formData, "house_number"),
    postal_code: getFormString(formData, "postal_code"),
    city: getFormString(formData, "city"),
    region: nullableFormString(formData, "region"),
    country: getFormString(formData, "country") || "Deutschland",
    primary_trade: getFormString(formData, "primary_trade"),
    secondary_trades: splitAdminList(getFormString(formData, "secondary_trades")),
    selected_services: splitAdminList(getFormString(formData, "selected_services")),
    service_radius_km: Number(getFormString(formData, "service_radius_km") || 50),
    service_regions: splitAdminList(getFormString(formData, "service_regions")),
    postal_codes: splitAdminList(getFormString(formData, "postal_codes")),
    short_description: getFormString(formData, "short_description"),
    description: nullableFormString(formData, "description"),
  };

  const { error } = await supabase.from("company_submissions").update(update).eq("id", id).neq("status", "approved");
  if (error) throw error;

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const submission = await getCompanySubmission(id);
  const supabase = getSupabaseAdmin();
  const claimCompanyId = claimCompanyIdFromSource(submission.source);
  const verified = formData.get("verified") === "on";
  const publicVisible = formData.get("public_visible") === "on";

  if (claimCompanyId) {
    const description = [
      submission.short_description,
      submission.description,
      submission.selected_services.length ? `Leistungen: ${submission.selected_services.join(", ")}` : "",
      submission.service_regions.length ? `Tätigkeitsgebiet: ${submission.service_regions.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .update({
        description,
        contact_name: [submission.contact_first_name, submission.contact_last_name].filter(Boolean).join(" ") || null,
        email: submission.email,
        phone: submission.phone,
        website_url: normalizeSubmissionWebsite(submission.website),
        street: [submission.street, submission.house_number].filter(Boolean).join(" ") || null,
        city: submission.city,
        postal_code: submission.postal_code,
        claim_status: "claimed",
        verified,
        public_visible: publicVisible,
      })
      .eq("id", claimCompanyId)
      .select("slug")
      .single();

    if (companyError || !company) throw companyError || new Error("Bestehender Betriebseintrag konnte nicht aktualisiert werden.");

    const { error: submissionError } = await supabase
      .from("company_submissions")
      .update({ status: "approved" })
      .eq("id", id);
    if (submissionError) throw submissionError;

    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${id}`);
    revalidatePath("/suche");
    revalidatePath("/");
    revalidatePath(`/firma/${company.slug}`);
    redirect(`/admin/submissions/${id}?approved=${company.slug}`);
  }

  const tradeName = tradeNameFromSlug(submission.primary_trade);
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .upsert({ name: tradeName, slug: submission.primary_trade }, { onConflict: "slug" })
    .select("id")
    .single();

  if (tradeError || !trade) throw tradeError || new Error("Gewerk konnte nicht angelegt werden.");

  const slug = await getUniqueCompanySlug(companySlug(submission.company_name, submission.postal_code, submission.city));
  const description = [
    submission.short_description,
    submission.description,
    submission.selected_services.length ? `Leistungen: ${submission.selected_services.join(", ")}` : "",
    submission.service_regions.length ? `Tätigkeitsgebiet: ${submission.service_regions.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      trade_id: trade.id,
      name: submission.company_name,
      slug,
      description,
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
      verified,
      public_visible: publicVisible,
    })
    .select("id, slug")
    .single();

  if (companyError || !company) throw companyError || new Error("Betriebseintrag konnte nicht angelegt werden.");

  const { error: submissionError } = await supabase
    .from("company_submissions")
    .update({ status: "approved" })
    .eq("id", id);
  if (submissionError) throw submissionError;

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/suche");
  revalidatePath("/");
  redirect(`/admin/submissions/${id}?approved=${company.slug}`);
}

export async function setResearchCandidateStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNotes = nullableFormString(formData, "admin_notes");
  const rejectedReason = nullableFormString(formData, "rejected_reason");
  if (!id || !["found", "validated", "duplicate", "rejected"].includes(status)) return;

  const update: Record<string, unknown> = { status };
  if (adminNotes) update.admin_notes = adminNotes;
  if (rejectedReason) update.rejected_reason = rejectedReason;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("research_company_candidates")
    .update(update)
    .eq("id", id)
    .neq("status", "approved");
  if (error) throw error;

  revalidatePath("/admin/research-imports");
  revalidatePath(`/admin/research-imports/${id}`);
}

export async function approveResearchCandidate(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const candidate = await getResearchCandidate(id);
  if (candidate.status === "approved") return;

  const supabase = getSupabaseAdmin();
  const duplicateId = nullableFormString(formData, "duplicate_company_id") || candidate.duplicate_company_id;

  if (duplicateId) {
    const { error } = await supabase
      .from("research_company_candidates")
      .update({
        status: "duplicate",
        duplicate_company_id: duplicateId,
        admin_notes: nullableFormString(formData, "admin_notes") || candidate.admin_notes,
      })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/research-imports");
    revalidatePath(`/admin/research-imports/${id}`);
    redirect(`/admin/research-imports/${id}?duplicate=1`);
  }

  const tradeSlug = slugify(candidate.trade_slug || candidate.trade_name);
  const tradeName = candidate.trade_name || tradeNameFromSlug(tradeSlug);
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .upsert({ name: tradeName, slug: tradeSlug }, { onConflict: "slug" })
    .select("id")
    .single();

  if (tradeError || !trade) throw tradeError || new Error("Gewerk konnte nicht angelegt werden.");

  const slug = await getUniqueCompanySlug(companySlug(candidate.company_name, candidate.postal_code, candidate.city));
  const description = [
    candidate.short_description || `${tradeName} in ${candidate.city}`,
    "Basis-Eintrag aus öffentlich zugänglichen Gewerbedaten. Noch nicht vom Betrieb bestätigt.",
    `Quelle: ${candidate.source_label} (${candidate.source_url})`,
    "Korrektur oder Löschung kann jederzeit über die im Profil angegebene Kontaktadresse angefragt werden.",
  ].join("\n\n");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      trade_id: trade.id,
      name: candidate.company_name,
      slug,
      description,
      contact_name: null,
      email: candidate.email,
      phone: candidate.phone,
      website_url: normalizeSubmissionWebsite(candidate.website),
      street: candidate.street,
      city: candidate.city,
      postal_code: candidate.postal_code,
      latitude: candidate.latitude ?? 0,
      longitude: candidate.longitude ?? 0,
      claim_status: "unclaimed",
      verified: false,
      public_visible: true,
    })
    .select("id, slug")
    .single();

  if (companyError || !company) throw companyError || new Error("Basis-Eintrag konnte nicht angelegt werden.");

  const { error: candidateError } = await supabase
    .from("research_company_candidates")
    .update({
      status: "approved",
      company_id: company.id,
      approved_at: new Date().toISOString(),
      approved_by: "admin",
      admin_notes: nullableFormString(formData, "admin_notes") || candidate.admin_notes,
    })
    .eq("id", id);
  if (candidateError) throw candidateError;

  revalidatePath("/admin/research-imports");
  revalidatePath(`/admin/research-imports/${id}`);
  revalidatePath("/");
  revalidatePath("/suche");
  redirect(`/admin/research-imports/${id}?approved=${company.slug}`);
}

function claimCompanyIdFromSource(source: string) {
  const match = source.match(/^claim:([0-9a-f-]{36})$/i);
  return match?.[1] || null;
}

export async function importCompanies(_prevState: ImportReport, formData: FormData): Promise<ImportReport> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "CSV-Datei fehlt.", created: 0, skipped: 0, errors: [] };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  const supabase = getSupabaseAdmin();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const parsed = csvCompanySchema.safeParse(rows[index]);

    if (!parsed.success) {
      errors.push(`Zeile ${rowNumber}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")}`);
      continue;
    }

    const input = parsed.data;
    const website = input.website;
    let duplicateQuery = supabase.from("companies").select("id").eq("name", input.name).eq("postal_code", input.postal_code).limit(1);
    duplicateQuery = website ? duplicateQuery.eq("website_url", website) : duplicateQuery.is("website_url", null);
    const { data: duplicate, error: duplicateError } = await duplicateQuery;

    if (duplicateError) {
      errors.push(`Zeile ${rowNumber}: ${duplicateError.message}`);
      continue;
    }

    if (duplicate && duplicate.length > 0) {
      skipped += 1;
      continue;
    }

    const tradeSlug = slugify(input.trade);
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .upsert({ name: input.trade, slug: tradeSlug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (tradeError || !trade) {
      errors.push(`Zeile ${rowNumber}: ${tradeError?.message || "Gewerk konnte nicht gespeichert werden."}`);
      continue;
    }

    const slug = await getUniqueCompanySlug(companySlug(input.name, input.postal_code, input.city));
    const { error: insertError } = await supabase.from("companies").insert({
      trade_id: trade.id,
      name: input.name,
      slug,
      description: `${input.trade} in ${input.city}`,
      email: input.email,
      phone: input.phone,
      website_url: website,
      city: input.city,
      postal_code: input.postal_code,
      latitude: input.latitude,
      longitude: input.longitude,
      claim_status: "unclaimed",
      verified: false,
      public_visible: true,
    });

    if (insertError) {
      errors.push(`Zeile ${rowNumber}: ${insertError.message}`);
      continue;
    }

    created += 1;
  }

  revalidatePath("/");
  revalidatePath("/suche");
  return {
    ok: errors.length === 0,
    message: `Import abgeschlossen: ${created} erstellt, ${skipped} uebersprungen, ${errors.length} Fehler.`,
    created,
    skipped,
    errors,
  };
}

export async function deleteCompany(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/");
}

export async function createTrade(formData: FormData) {
  const parsed = parseTradeName(formData);
  if (parsed.error || !parsed.name) {
    redirect(`/trades?error=${encodeURIComponent(parsed.error || "Ungueltiger Name")}`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("trades").insert({
    name: parsed.name,
    slug: slugify(parsed.name),
  });

  if (error) {
    redirect(`/trades?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trades");
  revalidatePath("/");
}

export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) {
    redirect(`/trades?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trades");
  revalidatePath("/");
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value || null;
}

function splitAdminList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function tradeNameFromSlug(slug: string) {
  const taxonomyTrade = tradeTaxonomy.find((trade) => trade.slug === slug);
  if (taxonomyTrade) return taxonomyTrade.name;

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
