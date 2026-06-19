"use server";

const APPROVAL_REQUIRED_MESSAGE = "Diese Aktion ist approval-pflichtig und aktuell nicht ausführbar.";

function approvalRequiredError() {
  return new Error(APPROVAL_REQUIRED_MESSAGE);
}

export async function approveClaim(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function approveResearchCandidate(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function approveSubmission(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function createCompany(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function deleteCompany(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function deletePlannerContact(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function deleteTrade(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function importCompanies(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function preparePlannerInvitation(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function sendPlannerInvitationDryRun(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function publishClaimSuggestion(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function rejectClaimSuggestion(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}

export async function updateCompany(_formData: FormData): Promise<never> {
  throw approvalRequiredError();
}
