"use server";

import type { CompanyFormState } from "@/lib/types";

/**
 * Compatibility response for legacy claim forms.
 *
 * Existing claim UI components remain in the repository for historical
 * compatibility, but no route may use their old service-role write path.
 * New claims must go through the authenticated magic-link flow and the
 * `submit_company_claim` RPC in `lib/actions/claim-ownership.ts`.
 */
export async function submitClaim(_prevState: CompanyFormState, _formData: FormData): Promise<CompanyFormState> {
  void _prevState;
  void _formData;
  return {
    ok: false,
    message: "Dieser alte Übernahmepfad ist deaktiviert. Bitte melden Sie sich per E-Mail an und nutzen Sie den sicheren Übernahmeantrag.",
  };
}
