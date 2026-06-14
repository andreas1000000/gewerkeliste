#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const args = parseArgs(process.argv.slice(2));
const filePath = args.file || args._[0];
const projectRef = args.project || process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!filePath) fail("SQL-Datei fehlt. Nutzung: npm run supabase:apply-sql -- --file ./supabase/migrations/datei.sql");
if (!projectRef) fail("SUPABASE_PROJECT_REF fehlt.");
if (!accessToken) fail("SUPABASE_ACCESS_TOKEN fehlt. Erforderlich ist ein Supabase Personal Access Token.");

const sql = await readFile(filePath, "utf8");
const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await response.text();
if (!response.ok) {
  fail(`Supabase SQL fehlgeschlagen (${response.status}): ${text}`);
}

console.log(text || JSON.stringify({ ok: true }));

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = "true";
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
