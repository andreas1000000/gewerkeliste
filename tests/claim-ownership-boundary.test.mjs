import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260713120000_claim_ownership_memberships.sql", import.meta.url), "utf8");
const hardeningMigration = await readFile(new URL("../supabase/migrations/20260714100000_claim_ownership_p1_hardening.sql", import.meta.url), "utf8");
const legacyClaimAction = await readFile(new URL("../lib/actions/claims.ts", import.meta.url), "utf8");
const claimRoute = await readFile(new URL("../app/betriebe/[slug]/claim/page.tsx", import.meta.url), "utf8");
const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
const browserClient = await readFile(new URL("../lib/supabase-browser.ts", import.meta.url), "utf8");
const claimAdminActions = await readFile(new URL("../lib/actions/claim-admin.ts", import.meta.url), "utf8");
const submissionActions = await readFile(new URL("../lib/actions/submissions.ts", import.meta.url), "utf8");
const adminActionAuth = await readFile(new URL("../lib/admin-action-auth.ts", import.meta.url), "utf8");

test("claim migration creates the authenticated ownership boundary", () => {
  assert.match(migration, /create table if not exists public\.company_memberships/);
  assert.match(migration, /auth_user_id uuid references auth\.users\(id\)/);
  assert.match(migration, /company_memberships_one_active_owner_idx/);
  assert.match(migration, /company_memberships_one_active_user_company_idx/);
  assert.match(migration, /alter table public\.company_memberships enable row level security/);
  assert.match(migration, /users read own company memberships/);
  assert.match(migration, /users read own claims/);
  assert.match(migration, /users read own submissions/);
});

test("only the intended authenticated and service-role database paths are granted", () => {
  assert.match(migration, /revoke all on table public\.company_memberships, public\.company_claims, public\.company_submissions\s+from public, anon, authenticated, service_role/);
  assert.match(migration, /grant select, insert, update, delete on table public\.company_memberships, public\.company_claims, public\.company_submissions\s+to service_role/);
  assert.match(migration, /grant execute on function public\.submit_company_claim\(uuid, text, text, text, text, boolean, boolean\) to authenticated/);
  assert.match(migration, /grant execute on function public\.submit_company_profile_change\(uuid, jsonb\) to authenticated/);
  assert.match(migration, /email_confirmed_at/);
  assert.match(migration, /consent_required/);
  assert.match(migration, /company_submissions_one_pending_owner_update_idx/);
  for (const functionName of [
    "approve_company_claim",
    "decide_company_claim",
    "revoke_company_membership",
    "approve_company_profile_submission",
    "decide_company_profile_submission",
  ]) {
    const functionBlock = migration.slice(migration.indexOf(`function public.${functionName}`));
    assert.match(functionBlock, /revoke all on function|auth\.role\(\) <> 'service_role'/);
    assert.match(migration, new RegExp(`grant execute on function public\\.${functionName}\\([^)]*\\) to service_role`));
  }
});

test("P1 hardening removes base-table ownership reads and exposes only safe self projections", () => {
  assert.match(hardeningMigration, /drop policy if exists "users read own company memberships"/);
  assert.match(hardeningMigration, /revoke all on table public\.company_memberships, public\.company_claims, public\.company_submissions\s+from public, anon, authenticated, service_role/);
  assert.match(hardeningMigration, /create or replace function public\.get_my_active_memberships\(p_company_id uuid default null\)/);
  assert.match(hardeningMigration, /create or replace function public\.get_my_claims\(\)/);
  assert.match(hardeningMigration, /create or replace function public\.get_my_owner_submissions\(p_company_id uuid\)/);
  const membershipProjection = hardeningMigration.slice(hardeningMigration.indexOf("function public.get_my_active_memberships"), hardeningMigration.indexOf("language sql", hardeningMigration.indexOf("function public.get_my_active_memberships")));
  const claimProjection = hardeningMigration.slice(hardeningMigration.indexOf("function public.get_my_claims"), hardeningMigration.indexOf("language sql", hardeningMigration.indexOf("function public.get_my_claims")));
  assert.doesNotMatch(membershipProjection, /user_id/);
  assert.doesNotMatch(claimProjection, /rejection_reason|auth_user_id|decided_by/);
  assert.match(hardeningMigration, /status in \('submitted', 'in_review'\)/);
  assert.match(hardeningMigration, /status <> 'pending'/);
  assert.match(hardeningMigration, /on delete set null/);
  assert.match(hardeningMigration, /former_user_id/);
  assert.match(hardeningMigration, /create or replace function public\.guard_company_claim_write/);
  assert.match(hardeningMigration, /claim_company_immutable/);
  assert.match(hardeningMigration, /claim_identity_immutable/);
  assert.match(hardeningMigration, /claim_submission_immutable/);
  assert.match(hardeningMigration, /claim_transition_required/);
  assert.match(hardeningMigration, /create or replace function public\.guard_company_audit_delete/);
  assert.match(hardeningMigration, /create or replace function public\.set_company_submission_review_status/);
  assert.match(hardeningMigration, /submission_reopen_forbidden/);
  assert.match(hardeningMigration, /create or replace function public\.guard_owner_submission_write/);
  assert.match(hardeningMigration, /owner_submission_identity_immutable/);
  assert.match(hardeningMigration, /company_claims_company_id_fkey[\s\S]*on delete restrict/);
});

test("claim public projection excludes claim submissions and owner auth identity", async () => {
  const publicDirectory = await readFile(new URL("../lib/data/public-directory.ts", import.meta.url), "utf8");
  const ownerMigration = hardeningMigration.slice(hardeningMigration.indexOf("function public.submit_company_profile_change"));
  assert.doesNotMatch(publicDirectory, /`claim:\$\{companyId\}`/);
  assert.match(publicDirectory, /\.not\("source", "like", "claim:%"\)/);
  assert.match(publicDirectory, /premium_submission_payload, source/);
  assert.match(publicDirectory, /submission\.source\.startsWith\("owner-profile-update:"\)/);
  assert.match(publicDirectory, /payload\.notes = null/);
  assert.match(publicDirectory, /company_trades\(confidence_score, source, evidence, status, visibility_level/);
  assert.match(publicDirectory, /select\("status, visibility_level, trades\(slug\)/);
  assert.doesNotMatch(publicDirectory, /companies!inner\(\*/);
  assert.doesNotMatch(publicDirectory, /from\("companies"\)[\s\S]{0,120}select\("\*"\)/);
  assert.match(publicDirectory, /\.eq\("company_id", companyId\)/);
  assert.match(submissionActions, /claim_status: "unclaimed"/);
  assert.match(ownerMigration, /coalesce\(nullif\(trim\(v_payload ->> 'public_email'\), ''\), v_company\.email\)/);
  assert.match(ownerMigration, /email = coalesce\(v_submission\.contact_email, v_company\.email\)/);
});

test("admin claim status changes use the transactional claim RPC", async () => {
  const actions = await readFile(new URL("../lib/actions.ts", import.meta.url), "utf8");
  assert.match(actions, /existingSubmission\?\.source\?\.startsWith\("claim:"\)/);
  assert.match(actions, /approveClaimOwnershipAction\(claimFormData\)/);
  assert.match(actions, /decideClaim\(claimFormData\)/);
  assert.match(actions, /export async function setSubmissionStatus[\s\S]*await requireAdminAction\(\)/);
  assert.doesNotMatch(actions.slice(actions.indexOf('existingSubmission?.source?.startsWith("claim:")'), actions.indexOf('existingSubmission?.source?.startsWith("owner-profile-update:")')), /\.from\("company_submissions"\)\.update/);
  assert.match(actions, /set_company_submission_review_status/);
});

test("ownership admin actions re-check the existing Basic Auth boundary", () => {
  assert.match(adminActionAuth, /headers\(\)/);
  assert.match(adminActionAuth, /process\.env\.ADMIN_SECRET/);
  assert.match(adminActionAuth, /isAuthorized/);
  for (const actionSource of [claimAdminActions, submissionActions]) {
    assert.match(actionSource, /requireAdminAction/);
  }
});

test("claim route requires an authenticated user and the old service-role action is disabled", () => {
  assert.match(claimRoute, /getSupabaseUser/);
  assert.match(claimRoute, /ClaimRequestForm/);
  assert.doesNotMatch(claimRoute, /ClaimAssistant/);
  assert.doesNotMatch(legacyClaimAction, /getSupabaseAdmin|\.from\("company_claims"\)|\.from\("company_submissions"\)/);
  assert.match(legacyClaimAction, /alter.*deaktiviert|deaktiviert/i);
});

test("owner profile decisions use the transactional approval RPC", async () => {
  const actions = await readFile(new URL("../lib/actions.ts", import.meta.url), "utf8");
  const ownerActions = await readFile(new URL("../lib/actions/owner-profile.ts", import.meta.url), "utf8");
  assert.match(actions, /owner-profile-update.*status === "approved"/s);
  assert.match(actions, /return approveOwnerSubmissionAction\(formData\)/);
  assert.match(ownerActions, /consent_authorized/);
  assert.match(ownerActions, /consent_privacy/);
});

test("direct privileged planner and owner profile paths stay behind explicit boundaries", async () => {
  const plannerActions = await readFile(new URL("../lib/actions/planner.ts", import.meta.url), "utf8");
  const data = await readFile(new URL("../lib/data.ts", import.meta.url), "utf8");
  const ownerPage = await readFile(new URL("../app/mein-betrieb/[companyId]/bearbeiten/page.tsx", import.meta.url), "utf8");
  assert.match(plannerActions, /export async function updatePlannerProfile[\s\S]*await requireAdminAction\(\)/);
  assert.match(data, /export async function getCompanyForOwnerProfile[\s\S]*select\([\s\S]*profile_image_alt/);
  assert.doesNotMatch(data.slice(data.indexOf("export async function getCompanyForOwnerProfile"), data.indexOf("export async function getCompanyBySlug")), /select\("\*"\)/);
  assert.match(ownerPage, /getCompanyForOwnerProfile/);
});

test("browser auth boundary cannot contain a service-role key", () => {
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(browserClient, /SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("business area is the only new middleware session-refresh boundary", () => {
  assert.match(middleware, /request\.nextUrl\.pathname === "\/mein-betrieb"/);
  assert.match(middleware, /startsWith\("\/mein-betrieb\/"\)/);
  assert.match(middleware, /"\/mein-betrieb\/:path\*"/);
  assert.match(middleware, /createServerClient/);
  assert.doesNotMatch(middleware, /ADMIN_SECRET.*NEXT_PUBLIC_SUPABASE/);
});
