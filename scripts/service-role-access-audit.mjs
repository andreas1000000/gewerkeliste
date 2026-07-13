import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const SOURCE_ROOTS = ["app", "components", "lib", "scripts"];
const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".tsx"]);
const SERVICE_ROLE_SECRET_PATTERN = /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_KEY)\b/;
const CLIENT_FACTORY_PATTERN = /\bcreateClient\s*\(/;
const ADMIN_CLIENT_PATTERN = /\bgetSupabaseAdmin\s*\(/;
const NEXT_PUBLIC_SECRET_PATTERN = /NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|SUPABASE_KEY)/i;
const LOGGED_SECRET_PATTERN = /console\.(?:debug|info|log|warn|error)\s*\([^\n]*(?:SERVICE_ROLE_KEY|SUPABASE_KEY|process\.env)/i;
const ALLOWED_DIRECT_APP_CALL_SITES = new Set(["app/admin/submissions/[id]/page.tsx"]);
const SERVER_SUPABASE_IMPORT_PATTERN = /@\/lib\/supabase(?:["'/)]|$)/;

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function extension(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index);
}

async function collectFiles(root, directory) {
  const absoluteDirectory = join(root, directory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativeFile = normalizePath(join(directory, entry.name));
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, relativeFile)));
      continue;
    }
    if (SOURCE_EXTENSIONS.has(extension(entry.name))) files.push(relativeFile);
  }

  return files;
}

export async function collectSourceFiles(root = process.cwd()) {
  const paths = (await Promise.all(SOURCE_ROOTS.map((directory) => collectFiles(root, directory)))).flat().sort();
  return Promise.all(paths.map(async (file) => ({
    file,
    source: await readFile(join(root, file), "utf8"),
  })));
}

export async function collectServiceRoleMigrationObjects(root = process.cwd()) {
  const migrationDirectory = join(root, "supabase/migrations");
  const files = (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort();
  const objects = new Set();

  for (const file of files) {
    const source = await readFile(join(migrationDirectory, file), "utf8");

    for (const match of source.matchAll(/create\s+policy[\s\S]{0,180}?\bon\s+([a-z_][a-z0-9_.]*)[\s\S]{0,240}?\bservice_role\b/gi)) {
      objects.add(match[1]);
    }

    for (const match of source.matchAll(/(?:grant|revoke)\s+(?:all(?:\s+privileges)?|(?:select|insert|update|delete|usage|truncate|references|trigger|maintain)(?:\s*,\s*(?:select|insert|update|delete|usage|truncate|references|trigger|maintain))*)\s+on\s+(?:table\s+)?([\s\S]*?)\s+(?:to|from)\s+service_role\b/gi)) {
      if (/\bon\s+function\b/i.test(match[0])) continue;
      for (const candidate of match[1].split(",")) {
       const object = candidate.trim().replace(/\s+/g, " ");
        if ((/^schema\s+[a-z_][a-z0-9_]*$/i.test(object) || /^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?$/i.test(object)) && !new Set(["select", "insert", "update", "delete", "public", "anon", "authenticated", "service_role"]).has(object.toLowerCase())) {
         objects.add(object);
       }
     }
   }
 }

 return [...objects].sort();
}

function isClientComponent(source) {
  return /^\s*["']use client["'];?/m.test(source);
}

function isPublicBoundary(file) {
  return file.startsWith("app/") || file.startsWith("components/");
}

function addViolation(violations, file, message) {
  violations.push(`${file}: ${message}`);
}

export function analyzeSourceFiles(entries) {
  const violations = [];
  const serviceRoleFiles = [];
  let adminClientCallCount = 0;

  for (const entry of entries) {
    const file = normalizePath(entry.file);
    const source = entry.source;
    const clientComponent = isClientComponent(source);
    const publicBoundary = isPublicBoundary(file);
    const hasSecretReference = SERVICE_ROLE_SECRET_PATTERN.test(source);
    const hasAdminClientReference = ADMIN_CLIENT_PATTERN.test(source);
    const hasClientFactory = CLIENT_FACTORY_PATTERN.test(source);

    if (hasSecretReference || hasAdminClientReference || hasClientFactory) serviceRoleFiles.push(file);
    adminClientCallCount += (source.match(/\bgetSupabaseAdmin\s*\(/g) || []).length;

    if (clientComponent && (hasSecretReference || hasAdminClientReference || hasClientFactory || SERVER_SUPABASE_IMPORT_PATTERN.test(source))) {
      addViolation(violations, file, "Client Component darf keine Service-Role-Quelle oder Supabase-Clientfabrik importieren.");
    }

    if (publicBoundary && hasSecretReference) {
      addViolation(violations, file, "Öffentliche App-/Component-Grenze enthält keinen zulässigen Service-Role-Key-Verweis.");
    }

    if (hasClientFactory && file !== "lib/supabase.ts" && !file.startsWith("scripts/")) {
      addViolation(violations, file, "Supabase-Clientfabrik ist ausschließlich in lib/supabase.ts oder isolierten CLI-Skripten zulässig.");
    }

    if (file.startsWith("app/") && hasAdminClientReference && !ALLOWED_DIRECT_APP_CALL_SITES.has(file)) {
      addViolation(violations, file, "Direkter Service-Role-Aufruf aus app/ ist nur am dokumentierten serverseitigen Admin-Sonderpfad zulässig.");
    }

    if (NEXT_PUBLIC_SECRET_PATTERN.test(source)) {
      addViolation(violations, file, "Service-Role-Konfiguration darf nie unter NEXT_PUBLIC_* erscheinen.");
    }

    if (LOGGED_SECRET_PATTERN.test(source)) {
      addViolation(violations, file, "Service-Role-Key oder Environment-Zugriff darf nicht geloggt werden.");
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    serviceRoleFiles: [...new Set(serviceRoleFiles)].sort(),
    adminClientCallCount,
    clientComponentCount: entries.filter((entry) => isClientComponent(entry.source)).length,
  };
}

export async function runRepositoryAudit(root = process.cwd()) {
  return analyzeSourceFiles(await collectSourceFiles(root));
}

export function formatAuditResult(result) {
  const lines = [
    `Service-Role-Access-Audit: ${result.ok ? "PASS" : "FAIL"}`,
    `Service-Role-Quellflächen: ${result.serviceRoleFiles.length}`,
    `getSupabaseAdmin-Aufrufe: ${result.adminClientCallCount}`,
    `Client Components geprüft: ${result.clientComponentCount}`,
  ];
  if (result.violations.length) {
    lines.push("Verstöße:");
    lines.push(...result.violations.map((violation) => `- ${violation}`));
  }
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runRepositoryAudit();
  console.log(formatAuditResult(result));
  if (!result.ok) process.exitCode = 1;
}
