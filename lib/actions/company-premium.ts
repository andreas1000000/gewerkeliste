"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";

const REVIEW_STATUSES = new Set(["pending", "approved", "rejected", "internal"]);

export async function updateCompanyPremiumProfile(formData: FormData) {
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
  await replaceRows("company_references", companyId, referenceRows);
  await replaceRows("company_reference_media", companyId, parseReferenceMedia(formString(formData, "reference_media")));
  await replaceRows("company_certificates", companyId, parseCertificates(formString(formData, "certificates")));

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}/premium`);
  if (companySlug) revalidatePath(`/firma/${companySlug}`);
  redirect(`/admin/companies/${companyId}/premium?saved=1`);
}

async function replaceRows(table: string, companyId: string, rows: Array<Record<string, unknown>>) {
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from(table).delete().eq("company_id", companyId);
  if (deleteError) throw deleteError;
  if (!rows.length) return;

  const { error: insertError } = await supabase.from(table).insert(rows.map((row, index) => ({
    ...row,
    company_id: companyId,
    sort_order: numberValue(row.sort_order, index),
  })));
  if (insertError) throw insertError;
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
      is_primary: /^ja|yes|true|1$/i.test(primary || "") || index === 0,
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
    const [title, projectType, location, year, description, services, clientType, status] = splitColumns(row);
    return {
      title,
      project_type: nullable(projectType),
      location: nullable(location),
      year: numberValue(year, null),
      description: nullable(description),
      services: splitList(services),
      client_type: nullable(clientType),
      review_status: reviewStatus(status),
      sort_order: index,
    };
  }).filter((row) => row.title);
}

function parseReferenceMedia(value: string) {
  return splitRows(value).map((row, index) => {
    const [fileUrl, altText, caption, status] = splitColumns(row);
    return {
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

function numberValue(value: unknown, fallback: number | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
