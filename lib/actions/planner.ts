"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { PlannerImportState, PlannerProfile } from "@/lib/types/planner";

type PlannerImportRow = {
  company_name: string;
  legal_form: string;
  contact_name: string;
  email: string;
  phone: string;
  mobile: string;
  website: string | null;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  trade_text: string;
  notes_private: string;
  source_label: string;
};

export async function importPlannerContacts(
  _prevState: PlannerImportState,
  formData: FormData,
): Promise<PlannerImportState> {
  const rowsJson = getFormString(formData, "rows_json");
  const filename = getFormString(formData, "filename") || "gewerkeliste-import.csv";
  if (!rowsJson) return { ok: false, message: "Keine Importdaten gefunden." };

  const rows = safeJsonArray(rowsJson);
  if (rows.length === 0) return { ok: false, message: "Die CSV enthält keine verwertbaren Zeilen." };

  const supabase = getSupabaseAdmin();
  const planner = await getOrCreateDefaultPlanner();
  const { data: importRow, error: importError } = await supabase
    .from("planner_imports")
    .insert({
      planner_id: planner.id,
      filename,
      row_count: rows.length,
      status: "imported",
    })
    .select("id")
    .single();
  if (importError || !importRow) return { ok: false, message: importError?.message || "Import konnte nicht angelegt werden." };

  let imported = 0;
  let duplicates = 0;
  let matched = 0;
  let suggestions = 0;

  for (const rawRow of rows) {
    const row = normalizePlannerImportRow(rawRow);
    if (!row.company_name) continue;

    const match = await findPlannerContactMatch(row);
    if (match.status === "possible_duplicate") duplicates += 1;
    if (match.status === "matched_existing") matched += 1;
    if (match.status === "new_suggestion") suggestions += 1;

    const { data: contact, error } = await supabase
      .from("planner_private_contacts")
      .insert({
        planner_id: planner.id,
        import_id: importRow.id,
        raw_company_name: row.company_name,
        normalized_company_name: normalizeCompanyName(row.company_name),
        contact_name: row.contact_name,
        email: row.email,
        phone: row.phone,
        mobile: row.mobile,
        website: row.website,
        street: row.street,
        postal_code: row.postal_code,
        city: row.city,
        country: row.country || "Deutschland",
        trade_text: row.trade_text,
        notes_private: row.notes_private,
        source_label: row.source_label || filename,
        matched_company_id: match.companyId,
        match_status: match.status,
        visibility_status: "private",
      })
      .select("id")
      .single();

    if (error || !contact) continue;

    if (match.status === "new_suggestion" || match.status === "possible_duplicate") {
      await supabase.from("company_suggestions").insert({
        planner_id: planner.id,
        private_contact_id: contact.id,
        company_id: match.companyId,
        raw_company_data: publicSuggestionData(row),
        suggested_trade_text: row.trade_text,
        status: "private",
      });
    }

    imported += 1;
  }

  await supabase
    .from("planner_imports")
    .update({
      imported_count: imported,
      duplicate_count: duplicates,
      matched_count: matched,
      suggestion_count: suggestions,
    })
    .eq("id", importRow.id);

  await bumpPlannerContribution(planner.id, Math.min(40, 10 + suggestions), "Gewerkeliste hochgeladen");

  revalidatePath("/planner/dashboard");
  revalidatePath("/planner/lists");
  revalidatePath("/planner/suggestions");
  return {
    ok: true,
    message: "Import gespeichert. Die Liste bleibt privat; Betriebe werden nicht automatisch veröffentlicht.",
    importId: importRow.id,
    imported,
    duplicates,
    matched,
    suggestions,
  };
}

export async function markPlannerContactPrivate(formData: FormData) {
  const id = getFormString(formData, "id");
  if (!id) return;
  const supabase = getSupabaseAdmin();
  await supabase.from("planner_private_contacts").update({ visibility_status: "private" }).eq("id", id);
  revalidatePath("/planner/lists");
}

export async function suggestPlannerContact(formData: FormData) {
  const id = getFormString(formData, "id");
  if (!id) return;
  const supabase = getSupabaseAdmin();
  const planner = await getOrCreateDefaultPlanner();
  await supabase.from("planner_private_contacts").update({ visibility_status: "suggested" }).eq("id", id).eq("planner_id", planner.id);
  await supabase.from("company_suggestions").update({ status: "suggested" }).eq("private_contact_id", id).eq("planner_id", planner.id);
  await bumpPlannerContribution(planner.id, 5, "Betrieb vorgeschlagen");
  revalidatePath("/planner/suggestions");
  revalidatePath("/planner/lists");
}

export async function updatePlannerProfile(formData: FormData) {
  const planner = await getOrCreateDefaultPlanner();
  const supabase = getSupabaseAdmin();
  const projectName = getFormString(formData, "project_name");
  const { error } = await supabase
    .from("planners")
    .update({
      company_name: nullableFormString(formData, "company_name"),
      website: normalizeSubmissionWebsite(nullableFormString(formData, "website")),
      public_email: nullableFormString(formData, "public_email"),
      profile_status: "active",
    })
    .eq("id", planner.id);
  if (error) throw error;

  if (projectName) {
    await supabase.from("planner_reference_projects").insert({
      planner_id: planner.id,
      project_name: projectName,
      city: nullableFormString(formData, "project_city"),
      project_year: nullableFormString(formData, "project_year"),
      description: nullableFormString(formData, "project_description"),
      image_url: nullableFormString(formData, "project_image_url"),
    });
    await bumpPlannerContribution(planner.id, 25, "Referenzprojekt angelegt");
  }

  revalidatePath("/planner/profile");
  revalidatePath("/planner/dashboard");
}

async function getOrCreateDefaultPlanner() {
  const supabase = getSupabaseAdmin();
  const email = process.env.PLANNER_DEFAULT_EMAIL || "kontakt@gewerkeliste.com";
  const name = process.env.PLANNER_DEFAULT_NAME || "Andreas Moser";
  const organizationName = process.env.PLANNER_DEFAULT_ORGANIZATION || "GewerkeListe Aufbau";

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, name, organization_name")
    .eq("email", email)
    .maybeSingle();
  const profile = existing || (await createPlannerProfile(email, name, organizationName));

  const { data: planner } = await supabase.from("planners").select("*").eq("user_id", profile.id).maybeSingle();
  if (planner) return planner as PlannerProfile;

  const alias = `planner-${String(profile.id).slice(0, 8)}@einladung.gewerkeliste.com`;
  const { data, error } = await supabase
    .from("planners")
    .insert({
      user_id: profile.id,
      company_name: profile.organization_name || organizationName,
      public_email: profile.email,
      alias_email: alias,
      contribution_reason: "Planer-OS MVP initialisiert",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PlannerProfile;
}

async function createPlannerProfile(email: string, name: string, organizationName: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      role: "planner",
      email,
      name,
      organization_name: organizationName,
    })
    .select("id, email, name, organization_name")
    .single();

  if (error) throw error;
  return data;
}

function safeJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") as Record<string, unknown>[] : [];
  } catch {
    return [];
  }
}

function normalizePlannerImportRow(row: Record<string, unknown>): PlannerImportRow {
  const stringValue = (key: string) => String(row[key] || "").trim();
  return {
    company_name: stringValue("company_name"),
    legal_form: stringValue("legal_form"),
    contact_name: stringValue("contact_name"),
    email: stringValue("email"),
    phone: stringValue("phone"),
    mobile: stringValue("mobile"),
    website: normalizeSubmissionWebsite(stringValue("website")),
    street: stringValue("street"),
    postal_code: stringValue("postal_code"),
    city: stringValue("city"),
    country: stringValue("country") || "Deutschland",
    trade_text: stringValue("trade_text"),
    notes_private: stringValue("notes_private"),
    source_label: stringValue("source_label"),
  };
}

async function findPlannerContactMatch(row: PlannerImportRow) {
  const supabase = getSupabaseAdmin();
  const domain = websiteDomain(row.website);
  if (domain) {
    const { data } = await supabase.from("companies").select("id, website_url").ilike("website_url", `%${domain}%`).limit(1);
    if (data?.[0]?.id) return { status: "matched_existing" as const, companyId: data[0].id as string };
  }

  const mailDomain = emailDomain(row.email);
  if (mailDomain) {
    const { data } = await supabase.from("companies").select("id, email").ilike("email", `%@${mailDomain}`).limit(1);
    if (data?.[0]?.id) return { status: "matched_existing" as const, companyId: data[0].id as string };
  }

  if (row.city || row.postal_code) {
    let query = supabase.from("companies").select("id, name, city, postal_code").limit(10);
    if (row.postal_code) query = query.eq("postal_code", row.postal_code);
    if (row.city) query = query.ilike("city", `%${row.city}%`);
    const { data } = await query;
    const match = (data || []).find((company) => similarCompanyName(row.company_name, String(company.name || "")));
    if (match?.id) return { status: "possible_duplicate" as const, companyId: match.id as string };
  }

  return { status: "new_suggestion" as const, companyId: null };
}

function publicSuggestionData(row: PlannerImportRow) {
  return {
    company_name: row.company_name,
    legal_form: row.legal_form || null,
    email: row.email || null,
    phone: row.phone || null,
    website: row.website || null,
    street: row.street || null,
    postal_code: row.postal_code || null,
    city: row.city || null,
    country: row.country || "Deutschland",
    trade_text: row.trade_text || null,
    source_label: row.source_label || null,
  };
}

async function bumpPlannerContribution(plannerId: string, points: number, reason: string) {
  const supabase = getSupabaseAdmin();
  const { data: planner } = await supabase
    .from("planners")
    .select("contribution_score")
    .eq("id", plannerId)
    .single();
  const nextScore = Math.max(0, Number(planner?.contribution_score || 0) + points);
  await supabase
    .from("planners")
    .update({
      contribution_score: nextScore,
      contribution_reason: reason,
      contribution_status: nextScore >= 30 ? "contributor" : "basic",
      full_access_unlocked: nextScore >= 30,
    })
    .eq("id", plannerId);
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value.length ? value : null;
}

function normalizeSubmissionWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeCompanyName(value: string) {
  let normalized = normalizeText(value);
  for (const form of LEGAL_FORMS) {
    normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(form)}\\b`, "g"), " ");
  }
  return normalized.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function websiteDomain(value: string | null | undefined) {
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function emailDomain(value: string | null | undefined) {
  const domain = value?.split("@")[1]?.trim().toLowerCase();
  if (!domain || GENERIC_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}

function similarCompanyName(a: string, b: string) {
  const left = normalizeCompanyName(a);
  const right = normalizeCompanyName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LEGAL_FORMS = [
  "gmbh & co kg",
  "gmbh und co kg",
  "gmbh",
  "ug haftungsbeschraenkt",
  "ug",
  "ag",
  "gbr",
  "e.k.",
  "ek",
  "ohg",
  "kg",
  "mbh",
  "inhaber",
  "inh.",
];

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "web.de",
  "gmx.de",
  "gmx.net",
  "t-online.de",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
]);
