import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import {
  hasMatchingSecret,
  isAuthorized,
  parseBasicCredentials,
} from "../lib/admin-auth.ts";
import {
  canAccessRequiredRole,
  getInternalAccessPolicy,
  getRequiredRole,
  internalRoles,
  isProtectedPath,
  roleMatrix,
} from "../lib/internal-access-policy.ts";
import { middleware } from "../middleware.ts";

function basic(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

test("protects only the intended internal path segments", () => {
  assert.equal(isProtectedPath("/admin"), true);
  assert.equal(isProtectedPath("/admin/claims"), true);
  assert.equal(isProtectedPath("/planner/contacts"), true);
  assert.equal(isProtectedPath("/companies/example/edit"), true);
  assert.equal(isProtectedPath("/trades"), true);
  assert.equal(isProtectedPath("/administer"), false);
  assert.equal(isProtectedPath("/company/example"), false);
  assert.equal(isProtectedPath("/gewerke"), false);
});

test("exposes the minimal role matrix without activating future identities", () => {
  assert.deepEqual(internalRoles, ["admin", "internal_editor", "business_user", "public_user"]);
  assert.deepEqual(roleMatrix.map((item) => [item.role, item.status]), [
    ["admin", "active"],
    ["internal_editor", "planned"],
    ["business_user", "planned"],
    ["public_user", "active"],
  ]);
  assert.equal(canAccessRequiredRole("admin", "admin"), true);
  assert.equal(canAccessRequiredRole("internal_editor", "admin"), false);
  assert.equal(canAccessRequiredRole("business_user", "admin"), false);
  assert.equal(canAccessRequiredRole("public_user", "admin"), false);
});

test("maps protected segments to the active admin policy and leaves similar prefixes public", () => {
  assert.equal(getRequiredRole("/admin"), "admin");
  assert.equal(getRequiredRole("/admin/claims"), "admin");
  assert.equal(getRequiredRole("/planner/contacts"), "admin");
  assert.equal(getRequiredRole("/companies/example/edit"), "admin");
  assert.equal(getRequiredRole("/trades"), "admin");
  assert.deepEqual(getInternalAccessPolicy("/admin"), {
    requiredRole: "admin",
    authentication: "basic_secret",
    status: "active",
  });
  assert.equal(getInternalAccessPolicy("/administer"), null);
  assert.equal(canAccessRequiredRole("public_user", getRequiredRole("/administer")), true);
});

test("malformed Basic authorization fails closed without throwing", () => {
  assert.equal(parseBasicCredentials(null), null);
  assert.equal(parseBasicCredentials("Bearer token"), null);
  assert.equal(parseBasicCredentials("Basic not-base64"), null);
  assert.equal(parseBasicCredentials("Basic YWRtaW4="), null);
  assert.equal(parseBasicCredentials("Basic\tYWRtaW46c2VjcmV0"), null);
  assert.equal(parseBasicCredentials("Basic\nYWRtaW46c2VjcmV0"), null);
  assert.equal(parseBasicCredentials(" Basic YWRtaW46c2VjcmV0"), null);
});

test("parses the complete password after the first separator", () => {
  assert.deepEqual(parseBasicCredentials(basic("operator", "secret:with:colon")), {
    username: "operator",
    password: "secret:with:colon",
  });
});

test("authorizes only a matching non-empty secret", async () => {
  assert.equal(await isAuthorized(basic("any-user", "correct-secret"), "correct-secret"), true);
  assert.equal(await isAuthorized(basic("any-user", "wrong-secret"), "correct-secret"), false);
  assert.equal(await isAuthorized("Basic malformed", "correct-secret"), false);
  assert.equal(await isAuthorized(basic("any-user", ""), "correct-secret"), false);
  assert.equal(await isAuthorized(basic("any-user", "correct-secret"), ""), false);
});

test("constant-time digest comparison rejects a different secret", async () => {
  assert.equal(await hasMatchingSecret("same", "same"), true);
  assert.equal(await hasMatchingSecret("same", "different"), false);
});

function request(pathname, authorization) {
  return new NextRequest(`https://gewerkeliste.test${pathname}`, {
    headers: authorization ? { authorization } : undefined,
  });
}

test("middleware allows a matching secret and passes through public paths", async () => {
  const previous = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "correct-secret";

  try {
    const authorized = await middleware(request("/admin", basic("operator", "correct-secret")));
    const publicResponse = await middleware(request("/gewerke"));

    assert.equal(authorized.status, 200);
    assert.equal(publicResponse.status, 200);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previous;
  }
});

test("middleware returns a non-cacheable challenge for unauthorized access", async () => {
  const previous = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "correct-secret";

  try {
    const response = await middleware(request("/admin", "Basic malformed"));

    assert.equal(response.status, 401);
    assert.equal(response.headers.get("www-authenticate"), 'Basic realm="GewerkeListe Admin"');
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previous;
  }
});

test("middleware fails closed without revealing configuration details", async () => {
  const previous = process.env.ADMIN_SECRET;
  delete process.env.ADMIN_SECRET;

  try {
    const response = await middleware(request("/admin"));

    assert.equal(response.status, 500);
    assert.equal(await response.text(), "Internal authentication configuration error");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previous;
  }
});
