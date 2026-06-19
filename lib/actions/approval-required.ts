"use server";

const APPROVAL_REQUIRED_MESSAGE = "Diese Aktion ist approval-pflichtig und aktuell nicht ausführbar.";

export async function deletePlannerContact(_formData: FormData) {
  throw new Error(APPROVAL_REQUIRED_MESSAGE);
}

export async function preparePlannerInvitation(_formData: FormData) {
  throw new Error(APPROVAL_REQUIRED_MESSAGE);
}

export async function sendPlannerInvitationDryRun(_formData: FormData) {
  throw new Error(APPROVAL_REQUIRED_MESSAGE);
}

export async function publishClaimSuggestion(_formData: FormData) {
  throw new Error(APPROVAL_REQUIRED_MESSAGE);
}

export async function rejectClaimSuggestion(_formData: FormData) {
  throw new Error(APPROVAL_REQUIRED_MESSAGE);
}
