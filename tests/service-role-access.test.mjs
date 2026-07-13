import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { classifyDeliveryDiff } from "../scripts/delivery-gate.mjs";
import {
  analyzeSourceFiles,
  collectServiceRoleMigrationObjects,
  runRepositoryAudit,
} from "../scripts/service-role-access-audit.mjs";

test("current repository keeps Service-Role access outside client boundaries", async () => {
  const result = await runRepositoryAudit();

  assert.equal(result.ok, true, result.violations.join("\n"));
  assert.ok(result.serviceRoleFiles.includes("lib/supabase.ts"));
  assert.ok(result.serviceRoleFiles.includes("app/admin/submissions/[id]/page.tsx"));
  assert.equal(result.clientComponentCount, 11);
  assert.ok(result.adminClientCallCount > 0);
});

test("client-boundary violations fail the audit", () => {
  const result = analyzeSourceFiles([
    {
      file: "components/unsafe.tsx",
      source: [
        '"use client";',
        'const key = process.env.SUPABASE_SERVICE_ROLE_KEY;',
        'const client = createClient("https://example.test", key);',
      ].join("\n"),
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.violations.length, 3);
  assert.match(result.violations.join("\n"), /Client Component/);
  assert.match(result.violations.join("\n"), /Öffentliche App/);
});

test("Service-Role values cannot be exposed through public environment names or logs", () => {
  const result = analyzeSourceFiles([
    {
      file: "lib/unsafe.ts",
      source: [
        'const publicKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;',
        'console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);',
      ].join("\n"),
    },
  ]);

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /NEXT_PUBLIC/);
  assert.match(result.violations.join("\n"), /geloggt/);
});

test("the inventory documents every Service-Role policy and grant object", async () => {
  const objects = await collectServiceRoleMigrationObjects();
  const document = await readFile("docs/knowledge/security/service-role-access-inventory.md", "utf8");

  assert.ok(objects.length > 0);
  for (const object of objects) {
    assert.ok(document.includes("`" + object + "`"), `Missing migration object: ${object}`);
  }
});

test("the guard and its test remain a non-runtime delivery diff", () => {
  const result = classifyDeliveryDiff([
    "docs/knowledge/security/service-role-access-inventory.md",
    "scripts/service-role-access-audit.mjs",
    "tests/service-role-access.test.mjs",
    "scripts/delivery-gate.mjs",
    "tests/delivery-gate.test.mjs",
  ]);

  assert.equal(result.classification, "NOT_APPLICABLE");
  assert.deepEqual(result.runtimeFiles, []);
});
