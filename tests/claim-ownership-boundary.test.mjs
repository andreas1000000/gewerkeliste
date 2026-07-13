import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260713120000_claim_ownership_memberships.sql", import.meta.url), "utf8");
const legacyClaimAction = await readFile(new URL("../lib/actions/claims.ts", import.meta.url), "utf8");
const claimRoute = await readFile(new URL("../app/betriebe/[slug]/claim/page.tsx", import.meta.url), "utf8");
const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
const browserClient = await readFile(new URL("../lib/supabase-browser.ts", import.meta.url), "utf8");

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
  assert.match(migration, /grant select on table public\.company_memberships, public\.company_claims, public\.company_submissions\s+to authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.company_memberships, public\.company_claims, public\.company_submissions\s+to service_role/);
  assert.match(migration, /grant execute on function public\.submit_company_claim\(uuid, text, text, text, text\) to authenticated/);
  assert.match(migration, /grant execute on function public\.submit_company_profile_change\(uuid, jsonb\) to authenticated/);
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

test("claim route requires an authenticated user and the old service-role action is disabled", () => {
  assert.match(claimRoute, /getSupabaseUser/);
  assert.match(claimRoute, /ClaimRequestForm/);
  assert.doesNotMatch(claimRoute, /ClaimAssistant/);
  assert.doesNotMatch(legacyClaimAction, /getSupabaseAdmin|\.from\("company_claims"\)|\.from\("company_submissions"\)/);
  assert.match(legacyClaimAction, /alter.*deaktiviert|deaktiviert/i);
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
