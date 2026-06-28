"use server";

import { revalidatePath } from "next/cache";
import { getCompany } from "@/lib/data";
import { slugify } from "@/lib/slug";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canonicalTradeSlug, findTaxonomyTrade } from "@/lib/trade-taxonomy";
import type { CompanyFormState } from "@/lib/types";
import { claimSchema, flattenZodErrors } from "@/lib/validation";

export async function submitClaim(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  if (formData.get("is_authorized") !== "on") {
    return {
      ok: false,
      message: "Bitte bestaetigen Sie, dass Sie berechtigt sind, diesen Betrieb zu vertreten.",
      fieldErrors: { is_authorized: "Berechtigung ist erforderlich." },
    };
  }

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
  const requesterRole = String(formData.get("requester_role") || "").trim();
  const proposedCompanyName = String(formData.get("proposed_company_name") || company.name).trim() || company.name;
  const proposedLegalForm = emptyStringToNull(String(formData.get("proposed_legal_form") || ""));
  const proposedStreet = emptyStringToNull(String(formData.get("proposed_street") || company.street || ""));
  const proposedPostalCode = String(formData.get("proposed_postal_code") || company.postal_code).trim() || company.postal_code;
  const proposedCity = String(formData.get("proposed_city") || company.city).trim() || company.city;
  const proposedPhone = emptyStringToNull(String(formData.get("proposed_phone") || company.phone || ""));
  const proposedEmail = emptyStringToNull(String(formData.get("proposed_email") || company.email || ""));
  const proposedWebsite = emptyStringToNull(String(formData.get("proposed_website") || company.website_url || ""));
  const proposedDescription = String(formData.get("proposed_description") || company.description || "").trim();
  const selectedServices = Array.from(new Set(formData.getAll("selectedServices").map((value) => String(value).trim()).filter(Boolean)));
  const missingServices = String(formData.get("missing_services") || "").trim();
  const requestedSpecializations = splitList(missingServices);
  const verificationNotes = [
    formData.get("verification_website") === "on" ? "Website entspricht Betrieb" : "",
    formData.get("verification_email_domain") === "on" ? "Geschaeftliche E-Mail-Domain passt zur Website" : "",
    formData.get("verification_phone_callback") === "on" ? "Telefonnummer-Rueckfrage moeglich" : "",
    formData.get("verification_document_later") === "on" ? "Gewerbenachweis kann bei Bedarf nachgereicht werden" : "",
  ].filter(Boolean);
  const requestedPrimaryTrade = canonicalTradeSlug(String(formData.get("primaryTrade") || company.trades?.slug || ""));
  if (!findTaxonomyTrade(requestedPrimaryTrade)) {
    return {
      ok: false,
      message: "Bitte waehle mindestens ein passendes Gewerk aus.",
      fieldErrors: { primaryTrade: "Mindestens ein Gewerk ist erforderlich." },
    };
  }
  const requestedSecondaryTrades = formData
    .getAll("secondaryTrades")
    .map((value) => canonicalTradeSlug(String(value)))
    .filter((slug) => slug && slug !== requestedPrimaryTrade && findTaxonomyTrade(slug))
    .slice(0, 4);
  const companyTradeSlug = findTaxonomyTrade(requestedPrimaryTrade)?.slug || slugify(company.trades?.name || "fachbetrieb");
  const { error: submissionError } = await supabase.from("company_submissions").insert({
    status: "submitted",
    company_name: proposedCompanyName,
    legal_form: proposedLegalForm,
    website: proposedWebsite,
    phone: proposedPhone,
    email: claim.email,
    contact_email: claim.email,
    contact_first_name: claim.name,
    contact_last_name: null,
    contact_role: requesterRole || "Eintragsuebernahme",
    contact_person_email: claim.email,
    contact_person_phone: claim.phone,
    street: proposedStreet,
    house_number: null,
    postal_code: proposedPostalCode,
    city: proposedCity,
    region: null,
    country: "Deutschland",
    primary_trade: companyTradeSlug,
    secondary_trades: requestedSecondaryTrades,
    selected_services: selectedServices,
    specializations: requestedSpecializations,
    service_radius_km: 50,
    service_regions: [proposedCity],
    postal_codes: [proposedPostalCode],
    service_countries: ["Deutschland"],
    short_description: proposedDescription.slice(0, 240) || `${company.trades?.name || "Fachbetrieb"} in ${proposedCity}`,
    description: [
      "Profiluebernahme fuer bestehenden Betriebseintrag.",
      "",
      claim.message,
      "",
      proposedDescription ? `Vorgeschlagener Profiltext:\n${proposedDescription}` : "",
      selectedServices.length ? `Ausgewaehlte Leistungen:\n- ${selectedServices.join("\n- ")}` : "Hinweis: keine konkreten Leistungen ausgewaehlt.",
      requestedSpecializations.length ? `Fehlende Leistungen / Spezialisierungen vorgeschlagen:\n- ${requestedSpecializations.join("\n- ")}` : "",
      verificationNotes.length ? `Nachweisangaben:\n- ${verificationNotes.join("\n- ")}` : "",
      supportSummary,
    ].filter(Boolean).join("\n"),
    references_text: [
      `Bestehende Firmen-ID: ${company.id}`,
      `Bestehender Slug: ${company.slug}`,
      proposedEmail ? `Vorgeschlagene oeffentliche E-Mail: ${proposedEmail}` : "",
    ].filter(Boolean).join("\n"),
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
    consent_authorized: true,
    consent_data_correct: false,
    consent_privacy: true,
    source: `claim:${company.id}`,
  });
  if (submissionError) return { ok: false, message: submissionError.message };

  await supabase.from("companies").update({ claim_status: "pending" }).eq("id", parsed.data.company_id).neq("claim_status", "claimed");

  revalidatePath("/");
  revalidatePath("/betriebe");
  revalidatePath("/suche");
  revalidatePath("/admin/claims");
  revalidatePath("/admin/submissions");
  return { ok: true, message: "Anfrage wurde gespeichert. Ein freiwilliger Förderbeitrag wird nur vorbereitet; automatisch wird nichts berechnet." };
}

function emptyStringToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function splitList(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSupportContribution(contribution: "none" | "49" | "99" | "199" | "custom", customAmount: number | null, invoiceRequested: boolean) {
  const amount =
    contribution === "none"
      ? "Ohne freiwilligen Förderbeitrag"
      : contribution === "custom"
        ? `${customAmount || 0} EUR freiwilliger Förderbeitrag`
        : `${contribution} EUR freiwilliger Förderbeitrag`;

  return [
    "Startphase: kostenloser Basiseintrag",
    `Förderoption: ${amount}`,
    `Rechnung auf Wunsch: ${invoiceRequested ? "ja" : "nein"}`,
    "Hinweis: Der freiwillige Förderbeitrag hat keinen Einfluss auf Prüfung, Darstellung oder Verifizierung des Basiseintrags.",
    "Status: automatisch wird nichts berechnet",
  ].join("\n");
}
