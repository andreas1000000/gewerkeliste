"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-action-auth";
import { redirect } from "next/navigation";
import { normalizeSocialLink } from "@/lib/social-links";
import { getSupabaseAdmin } from "@/lib/supabase";

const REVIEW_STATUSES = new Set(["pending", "approved", "rejected", "internal"]);

export async function updateCompanyPremiumProfile(formData: FormData) {
  await requireAdminAction();
  const companyId = formString(formData, "company_id");
  const companySlug = formString(formData, "company_slug");
  if (!companyId) return;

  const supabase = getSupabaseAdmin();
  const profilePackage = formString(formData, "profile_package") === "verified_start" ? "verified_start" : "basis";
  const verified = formData.get("verified") === "on";
  const premiumStartedAt = nullableDateTime(formData, "premium_started_at");
  const premiumExpiresAt = nullableDateTime(formData, "premium_expires_at");

  const companyUpdate = {
    profile_package: profilePackage,
    verified,
    profile_status: verified ? "verified" : "claimed",
    verification_date: verified ? nullableDateTime(formData, "verification_date") || new Date().toISOString() : null,
    premium_started_at: profilePackage === "verified_start" ? premiumStartedAt : null,
    premium_expires_at: profilePackage === "verified_start" ? premiumExpiresAt : null,
  };

  const { error: companyError } = await supabase.from("companies").update(companyUpdate).eq("id", companyId);
  if (companyError) redirect(`/admin/companies/${companyId}/premium?error=${encodeURIComponent(companyError.message)}`);

  await replaceRows("company_contacts", companyId, parseContacts(formString(formData, "contacts")));
  await replaceRows("company_team_members", companyId, parseTeamMembers(formString(formData, "team_members")));
  const referenceRows = parseReferences(formString(formData, "references"));
  const insertedReferences = await replaceRows("company_references", companyId, referenceRows, "id,title,sort_order");
  await replaceRows("company_reference_media", companyId, parseReferenceMedia(formString(formData, "reference_media"), insertedReferences));
  await replaceRows("company_certificates", companyId, parseCertificates(formString(formData, "certificates")));
  await replaceRows("company_social_links", companyId, parseSocialLinks(formString(formData, "social_links")));

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}/premium`);
  if (companySlug) revalidatePath(`/firma/${companySlug}`);
  redirect(`/admin/companies/${companyId}/premium?saved=1`);
}

async function replaceRows(table: string, companyId: string, rows: Array<Record<string, unknown>>, selectColumns = "id") {
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from(table).delete().eq("company_id", companyId);
  if (deleteError) throw deleteError;
  if (!rows.length) return [];

  const { error: insertError } = await supabase.from(table).insert(rows.map((row, index) => ({
    ...row,
    company_id: companyId,
    sort_order: numberValue(row.sort_order, index),
  }))).select(selectColumns);
  if (insertError) throw insertError;
  const { data, error } = await supabase
    .from(table)
    .select(selectColumns)
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data || []) as unknown) as Array<Record<string, unknown>>;
}

function parseContacts(value: string) {
  return splitRows(value).map((row, index) => {
    const [name, role, phone, email, imageUrl, status, primary] = splitColumns(row);
    return {
      name,
      role: nullable(role),
      phone: nullable(phone),
      email: nullable(email),
      image_url: nullable(imageUrl),
      review_status: reviewStatus(status),
      is_primary: boolValue(primary) || index === 0,
      sort_order: index,
    };
  }).filter((row) => row.name);
}

function parseTeamMembers(value: string) {
  return splitRows(value).map((row, index) => {
    const [name, role, description, imageUrl, status] = splitColumns(row);
    return {
      name,
      role: nullable(role),
      description: nullable(description),
      image_url: nullable(imageUrl),
      review_status: reviewStatus(status),
      sort_order: index,
    };
  }).filter((row) => row.name);
}

function parseReferences(value: string) {
  return splitRows(value).map((row, index) => {
    const [title, projectType, location, yearOrPeriod, description, services, challenge, solution, clientType, clientName, clientPublic, status] = splitColumns(row);
    return {
      title,
      project_type: nullable(projectType),
      location: nullable(location),
      year: parseReferenceYear(yearOrPeriod),
      period: parseReferencePeriod(yearOrPeriod),
      description: nullable(description),
      services: splitList(services),
      challenge: nullable(challenge),
      solution: nullable(solution),
      client_type: nullable(clientType),
      client_name: nullable(clientName),
      client_public: boolValue(clientPublic),
      review_status: reviewStatus(status),
      sort_order: index,
    };
  }).filter((row) => row.title);
}

function parseReferenceMedia(value: string, references: Array<Record<string, unknown>>) {
  const referenceIdByTitle = new Map(
    references
      .map((reference) => [
        typeof reference.title === "string" ? reference.title.trim().toLowerCase() : "",
        typeof reference.id === "string" ? reference.id : null,
      ] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
  );

  return splitRows(value).map((row, index) => {
    const [referenceTitle, fileUrl, altText, caption, status] = splitColumns(row);
    return {
      reference_id: referenceTitle ? referenceIdByTitle.get(referenceTitle.trim().toLowerCase()) || null : null,
      file_url: fileUrl,
      alt_text: nullable(altText),
      caption: nullable(caption),
      review_status: reviewStatus(status),
      sort_order: index,
    };
  }).filter((row) => row.file_url);
}

function parseCertificates(value: string) {
  return splitRows(value).map((row, index) => {
    const [title, issuer, issuedAt, validUntil, description, fileUrl, status] = splitColumns(row);
    return {
      title,
      issuer: nullable(issuer),
      issued_at: nullableDate(issuedAt),
      valid_until: nullableDate(validUntil),
      description: nullable(description),
      file_url: nullable(fileUrl),
      review_status: reviewStatus(status),
      sort_order: index,
    };
  }).filter((row) => row.title);
}

function parseSocialLinks(value: string) {
  return splitRows(value).map((row, index) => {
    const [platform, url, label, status] = splitColumns(row);
    const normalized = normalizeSocialLink(platform, url, label);
    return normalized
      ? {
          platform: normalized.platform,
          url: normalized.url,
          label: normalized.label,
          review_status: reviewStatus(status),
          sort_order: index,
        }
      : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function splitRows(value: string) {
  return value.split(/\n+/).map((row) => row.trim()).filter(Boolean);
}

function splitColumns(value: string) {
  return value.split("|").map((item) => item.trim());
}

function splitList(value?: string) {
  return (value || "").split(/[,;]+/).map((item) => item.trim()).filter(Boolean);
}

function reviewStatus(value?: string) {
  const normalized = (value || "pending").trim().toLowerCase();
  return REVIEW_STATUSES.has(normalized) ? normalized : "pending";
}

function nullable(value?: string) {
  const trimmed = (value || "").trim();
  return trimmed || null;
}

function nullableDate(value?: string) {
  const trimmed = (value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function nullableDateTime(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseReferenceYear(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : null;
}

function parseReferencePeriod(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  return parseReferenceYear(trimmed) ? null : trimmed;
}

function boolValue(value?: string) {
  return /^(ja|yes|true|1)$/i.test((value || "").trim());
}

function numberValue(value: unknown, fallback: number | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
