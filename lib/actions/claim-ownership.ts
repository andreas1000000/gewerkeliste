"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type ClaimRequestState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const initialClaimRequestState: ClaimRequestState = { ok: false, message: "" };

export async function submitClaimRequest(
  companyId: string,
  _previousState: ClaimRequestState,
  formData: FormData,
): Promise<ClaimRequestState> {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) {
    return { ok: false, message: "Bitte melden Sie sich zuerst per E-Mail an." };
  }

  const name = stringValue(formData, "name");
  const role = stringValue(formData, "role");
  const phone = stringValue(formData, "phone");
  const authorizationNotes = stringValue(formData, "authorization_notes");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Bitte geben Sie Ihren Namen an.";
  if (role.length < 2) fieldErrors.role = "Bitte geben Sie Ihre Funktion im Betrieb an.";
  if (authorizationNotes.length < 10) fieldErrors.authorization_notes = "Bitte beschreiben Sie kurz, wie die Vertretungsberechtigung geprüft werden kann.";
  if (formData.get("is_authorized") !== "on") fieldErrors.is_authorized = "Die Vertretungsberechtigung muss bestätigt werden.";
  if (formData.get("consent_privacy") !== "on") fieldErrors.consent_privacy = "Bitte bestätigen Sie die Datenschutzhinweise.";
  if (!isUuid(companyId)) fieldErrors.company_id = "Der Betriebseintrag ist ungültig.";

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Bitte prüfen Sie die markierten Angaben.", fieldErrors };
  }

  const { error } = await supabase.rpc("submit_company_claim", {
    p_company_id: companyId,
    p_name: name,
    p_phone: phone || null,
    p_role: role,
    p_authorization_notes: authorizationNotes,
    p_consent_authorized: true,
    p_consent_privacy: true,
  });

  if (error) {
    return { ok: false, message: claimErrorMessage(error.message) };
  }

  revalidatePath("/mein-betrieb");
  revalidatePath("/admin/claims");
  return { ok: true, message: "Ihr Übernahmeantrag wurde gespeichert. Die Prüfung erfolgt manuell." };
}

export { initialClaimRequestState };

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function claimErrorMessage(message: string) {
  if (message.includes("company_already_claimed")) return "Dieser Betrieb ist bereits übernommen. Bitte wenden Sie sich an den manuellen Support; Informationen über den bisherigen Zugang werden nicht angezeigt.";
  if (message.includes("company_not_found")) return "Der Betriebseintrag wurde nicht gefunden.";
  if (message.includes("authenticated_email_required")) return "Bitte bestätigen Sie zuerst Ihre E-Mail-Anmeldung.";
  if (message.includes("consent_required")) return "Bitte bestätigen Sie die erforderlichen Zustimmungen.";
  if (message.includes("claim_user_missing")) return "Der Übernahmeantrag konnte keinem Zugang zugeordnet werden.";
  return "Der Übernahmeantrag konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
}
