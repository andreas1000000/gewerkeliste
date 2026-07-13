"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type OwnerProfileState = {
  ok: boolean;
  message: string;
  submissionId?: string;
  fieldErrors?: Record<string, string>;
};

const initialOwnerProfileState: OwnerProfileState = { ok: false, message: "" };

export async function submitOwnerProfileChange(
  companyId: string,
  _previousState: OwnerProfileState,
  formData: FormData,
): Promise<OwnerProfileState> {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { ok: false, message: "Bitte melden Sie sich erneut an." };

  const { data: membership, error: membershipError } = await supabase
    .from("company_memberships")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle();
  if (membershipError || !membership) return { ok: false, message: "Für diesen Betrieb besteht kein aktiver Owner-Zugang." };

  const payload = readPayload(formData);
  const fieldErrors: Record<string, string> = {};
  if (payload.company_name.length < 2) fieldErrors.company_name = "Bitte geben Sie den Firmennamen an.";
  if (!/^\d{5}$/.test(payload.postal_code)) fieldErrors.postal_code = "Bitte geben Sie eine fünfstellige PLZ an.";
  if (!payload.city) fieldErrors.city = "Bitte geben Sie den Ort an.";
  if (payload.public_email && !/^\S+@\S+\.\S+$/.test(payload.public_email)) fieldErrors.public_email = "Bitte prüfen Sie die öffentliche E-Mail-Adresse.";
  if (payload.service_radius_km < 0 || payload.service_radius_km > 1000) fieldErrors.service_radius_km = "Der Radius muss zwischen 0 und 1000 km liegen.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Bitte prüfen Sie die markierten Angaben.", fieldErrors };

  const { data: submissionId, error } = await supabase.rpc("submit_company_profile_change", {
    p_company_id: companyId,
    p_payload: payload,
  });
  if (error) {
    if (error.message.includes("profile_change_already_pending")) return { ok: false, message: "Es liegt bereits eine offene Profiländerung zur Prüfung vor." };
    if (error.message.includes("active_membership_required")) return { ok: false, message: "Der Owner-Zugang ist nicht mehr aktiv." };
    return { ok: false, message: "Die Profiländerung konnte nicht eingereicht werden." };
  }

  revalidatePath(`/mein-betrieb/${companyId}`);
  revalidatePath(`/mein-betrieb/${companyId}/bearbeiten`);
  revalidatePath("/mein-betrieb");
  revalidatePath("/admin/submissions");
  return { ok: true, message: "Die Änderung wurde zur Prüfung eingereicht. Das öffentliche Profil bleibt bis zur Freigabe unverändert.", submissionId: String(submissionId || "") };
}

export { initialOwnerProfileState };

function readPayload(formData: FormData) {
  return {
    company_name: value(formData, "company_name"),
    legal_form: value(formData, "legal_form"),
    street: value(formData, "street"),
    postal_code: value(formData, "postal_code"),
    city: value(formData, "city"),
    website: value(formData, "website"),
    public_email: value(formData, "public_email"),
    phone: value(formData, "phone"),
    short_description: value(formData, "short_description"),
    description: value(formData, "description"),
    secondary_trades: list(formData, "secondary_trades"),
    selected_services: list(formData, "selected_services"),
    specializations: list(formData, "specializations"),
    service_radius_km: Number(value(formData, "service_radius_km") || 50),
    service_regions: list(formData, "service_regions"),
    postal_codes: list(formData, "postal_codes"),
    service_countries: list(formData, "service_countries"),
    logo_url: value(formData, "logo_url"),
    profile_image_url: value(formData, "profile_image_url"),
    profile_image_alt: value(formData, "profile_image_alt"),
    contact_name: value(formData, "contact_name"),
    contact_role: value(formData, "contact_role"),
    contact_phone: value(formData, "contact_phone"),
    memberships: list(formData, "memberships"),
    certificates: list(formData, "certificates"),
    manufacturer_certificates: list(formData, "manufacturer_certificates"),
    references_text: value(formData, "references_text"),
    social_links: parseSocialLinks(value(formData, "social_links")),
    notes: value(formData, "notes"),
  };
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function list(formData: FormData, key: string) {
  return value(formData, key).split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
}

function parseSocialLinks(raw: string) {
  return raw.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line) => {
    const [platform, url, label] = line.split("|").map((item) => item.trim());
    return { platform: platform || "", url: url || "", label: label || null, sort_order: 0 };
  });
}
