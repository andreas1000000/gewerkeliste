import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  assertWritesAllowed,
  blockedWriteResponse,
  getRuntimeWriteDecision,
  isWriteHttpMethod,
  shouldBlockHttpWrite,
  WriteBlockedError,
  WRITE_BLOCKED_MESSAGE,
} from "../lib/runtime/write-guard.ts";
import { createWriteGuardedSupabaseClient } from "../lib/supabase.ts";
import { canonicalProfileUrl, publicProfileRobots } from "../lib/public-profile-seo.ts";
import { isAdminProtectedPathname } from "../lib/runtime/request-guard.ts";
import { evaluateLocalFixtureEnvironment } from "../scripts/local-fixture-guards.mjs";

const previewEnv = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_TARGET_ENV: "preview",
  NODE_ENV: "production",
};

test("VERCEL_ENV=preview blocks POST", () => {
  assert.equal(shouldBlockHttpWrite("POST", previewEnv), true);
});

test("preview blocks PUT", () => {
  assert.equal(shouldBlockHttpWrite("PUT", previewEnv), true);
});

test("preview blocks PATCH", () => {
  assert.equal(shouldBlockHttpWrite("PATCH", previewEnv), true);
});

test("preview blocks DELETE", () => {
  assert.equal(shouldBlockHttpWrite("DELETE", previewEnv), true);
});

test("preview allows GET", () => {
  assert.equal(shouldBlockHttpWrite("GET", previewEnv), false);
  assert.equal(isWriteHttpMethod("GET"), false);
});

test("preview allows HEAD", () => {
  assert.equal(shouldBlockHttpWrite("HEAD", previewEnv), false);
  assert.equal(isWriteHttpMethod("HEAD"), false);
});

test("central guard blocks a direct Supabase mutation in preview", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv(previewEnv, () => {
    assert.throws(() => supabase.from("company_submissions").insert({ id: "blocked" }), WriteBlockedError);
  });

  assert.deepEqual(calls, []);
});

test("central guard blocks Storage upload in preview", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv(previewEnv, () => {
    assert.throws(() => supabase.storage.from("company-media").upload("preview/logo.png", "file"), WriteBlockedError);
  });

  assert.deepEqual(calls, []);
});

test("central guard blocks email side effects in preview", () => {
  withProcessEnv(previewEnv, () => {
    assert.throws(() => assertWritesAllowed({ operation: "email.send", target: "public-profile-notification" }), WriteBlockedError);
  });
});

test("central guard blocks auth admin writes in preview", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv(previewEnv, () => {
    assert.throws(() => supabase.auth.admin.createUser({ email: "blocked@example.invalid" }), WriteBlockedError);
  });

  assert.deepEqual(calls, []);
});

test("production mode leaves the existing authorization layer responsible for writes", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv({ VERCEL: "1", VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production", NODE_ENV: "production" }, () => {
    supabase.from("companies").update({ public_visible: true });
  });

  assert.deepEqual(calls, [{ operation: "update", table: "companies", payload: { public_visible: true } }]);
});

test("unknown environment allows no write operations", () => {
  assert.deepEqual(getRuntimeWriteDecision({ NODE_ENV: "production" }).allowed, false);
  assert.equal(shouldBlockHttpWrite("POST", { NODE_ENV: "production" }), true);
});

test("ADMIN_SECRET is not required for public profile pages", () => {
  assert.equal(isAdminProtectedPathname("/firma/metallteq-83101-rohrdorf"), false);
  assert.equal(isAdminProtectedPathname("/suche"), false);
  assert.equal(shouldBlockHttpWrite("GET", previewEnv), false);
});

test("service role key is not referenced from client components", async () => {
  const clientFiles = await filesContainingUseClient(process.cwd());

  for (const file of clientFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdmin/);
  }
});

test("fixture flags cannot enable local fixtures in preview", () => {
  const result = evaluateLocalFixtureEnvironment({
    ...previewEnv,
    GEWERKELISTE_ENABLE_LOCAL_FIXTURES: "1",
    GEWERKELISTE_FIXTURE_ENV: "local",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });

  assert.equal(result.allowed, false);
  assert.match(result.reasons.join(" "), /Vercel/);
});

test("blocked mutation performs no data change", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv(previewEnv, () => {
    assert.throws(() => supabase.from("companies").delete().eq("id", "company-1"), WriteBlockedError);
  });

  assert.equal(calls.length, 0);
});

test("blocked request response contains no secrets", async () => {
  const response = blockedWriteResponse();
  const body = await response.text();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(body, WRITE_BLOCKED_MESSAGE);
  assert.doesNotMatch(body, /SUPABASE|SERVICE_ROLE|ADMIN_SECRET|postgres|password|token/i);
});

test("public profile GET requests remain available in preview", () => {
  assert.equal(shouldBlockHttpWrite("GET", previewEnv), false);
  assert.equal(publicProfileRobots(previewEnv).index, false);
});

test("sitemap and metadata GET requests remain available in preview", () => {
  assert.equal(shouldBlockHttpWrite("GET", previewEnv), false);
  assert.equal(canonicalProfileUrl("metallteq-83101-rohrdorf"), "https://gewerkeliste.com/firma/metallteq-83101-rohrdorf");
});

test("server action writes are blocked before mutation", () => {
  const calls = [];
  const serverAction = () => {
    assertWritesAllowed({ operation: "server-action.submit-business-entry" });
    calls.push("mutated");
  };

  withProcessEnv(previewEnv, () => {
    assert.throws(serverAction, WriteBlockedError);
  });

  assert.deepEqual(calls, []);
});

test("direct internal mutation calls are blocked as defense in depth", () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  withProcessEnv(previewEnv, () => {
    assert.throws(() => supabase.rpc("publish_company_profile", { company_id: "company-1" }), WriteBlockedError);
  });

  assert.deepEqual(calls, []);
});

test("storage reads and public GET-like Supabase reads are still allowed in preview", async () => {
  const calls = [];
  const supabase = createWriteGuardedSupabaseClient(fakeSupabase(calls));

  await withProcessEnv(previewEnv, async () => {
    const profileQuery = supabase.from("companies").select("id,slug").eq("slug", "metallteq-83101-rohrdorf");
    const signedUrl = await supabase.storage.from("company-media").createSignedUrl("logo.png", 3600);

    assert.equal(profileQuery.kind, "select");
    assert.equal(profileQuery.table, "companies");
    assert.equal(profileQuery.columns, "id,slug");
    assert.deepEqual(profileQuery.filters, [{ column: "slug", value: "metallteq-83101-rohrdorf" }]);
    assert.equal(signedUrl.data.signedUrl, "https://assets.example.com/logo.png");
  });

  assert.deepEqual(calls, []);
});

function fakeSupabase(calls) {
  return {
    from(table) {
      return {
        insert(payload) {
          calls.push({ operation: "insert", table, payload });
          return { select: () => ({ single: () => ({ data: null, error: null }) }) };
        },
        update(payload) {
          calls.push({ operation: "update", table, payload });
          return { eq: () => ({ data: null, error: null }) };
        },
        upsert(payload) {
          calls.push({ operation: "upsert", table, payload });
          return { select: () => ({ data: null, error: null }) };
        },
        delete() {
          calls.push({ operation: "delete", table });
          return { eq: () => ({ data: null, error: null }) };
        },
        select(columns) {
          return {
            kind: "select",
            table,
            columns,
            filters: [],
            eq(column, value) {
              this.filters.push({ column, value });
              return this;
            },
          };
        },
      };
    },
    rpc(functionName, params) {
      calls.push({ operation: "rpc", functionName, params });
      return { data: null, error: null };
    },
    storage: {
      from(bucket) {
        return {
          upload(filePath, file) {
            calls.push({ operation: "upload", bucket, filePath, file });
            return { data: null, error: null };
          },
          createSignedUrl(filePath) {
            return { data: { signedUrl: `https://assets.example.com/${filePath}` }, error: null };
          },
        };
      },
    },
    auth: {
      admin: {
        createUser(payload) {
          calls.push({ operation: "createUser", payload });
          return { data: null, error: null };
        },
      },
    },
  };
}

async function filesContainingUseClient(root) {
  const roots = ["app", "components"].map((dir) => path.join(root, dir));
  const files = [];

  for (const start of roots) {
    await walk(start, files);
  }

  const clientFiles = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (/^["']use client["'];?/m.test(source)) {
      clientFiles.push(file);
    }
  }

  return clientFiles;
}

async function walk(dir, files) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      await walk(fullPath, files);
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

function withProcessEnv(env, callback) {
  const previous = {};
  const keys = new Set([...Object.keys(env), "VERCEL", "VERCEL_ENV", "VERCEL_TARGET_ENV", "NODE_ENV"]);

  for (const key of keys) {
    previous[key] = process.env[key];
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(env, key)) {
      process.env[key] = env[key];
    } else {
      delete process.env[key];
    }
  }

  const restore = () => {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  };

  try {
    const result = callback();
    if (result && typeof result.then === "function") {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}
