export function requireLiveConfirmation({ args, action, reason }) {
  const expected = String(action || "").trim();
  if (!expected) throw new Error("Live confirmation action is required.");

  const cliConfirmation = stringValue(args["confirm-live"]);
  const envConfirmation = stringValue(process.env.GEWERKELISTE_CONFIRM_LIVE);
  if (cliConfirmation === expected || envConfirmation === expected) return;

  fail(
    [
      `Live-Aktion blockiert: ${expected}`,
      reason ? `Grund: ${reason}` : null,
      `Erforderlich: --confirm-live ${expected}`,
      `Alternativ lokal: GEWERKELISTE_CONFIRM_LIVE=${expected}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export function requireRemoteSqlConfirmation({ args }) {
  requireLiveConfirmation({
    args,
    action: "apply-remote-sql",
    reason: "Remote-SQL kann Production-Datenbank-Schema oder Live-Daten veraendern.",
  });

  if (process.env.GEWERKELISTE_ALLOW_REMOTE_SQL !== "true") {
    fail("Remote-SQL blockiert: Setze zusaetzlich GEWERKELISTE_ALLOW_REMOTE_SQL=true.");
  }
}

export function requireSupabaseSafety({ args, url, live, action }) {
  if (!url) return;
  if (isLocalSupabaseUrl(url)) return;

  if (live) {
    requireLiveConfirmation({
      args,
      action,
      reason: "Nicht-lokale Supabase-URL erkannt. Live-Schreibzugriffe brauchen eine ausdrueckliche Production-Write-Freigabe.",
    });

    if (process.env.GEWERKELISTE_ALLOW_PRODUCTION_WRITE !== "true") {
      fail("Production-Schreibzugriff blockiert: Setze zusaetzlich GEWERKELISTE_ALLOW_PRODUCTION_WRITE=true.");
    }
    return;
  }

  if (process.env.GEWERKELISTE_ALLOW_REMOTE_READ !== "true") {
    fail("Remote-Supabase-Lesezugriff im Dry Run blockiert: Nutze lokale Supabase oder setze bewusst GEWERKELISTE_ALLOW_REMOTE_READ=true.");
  }
}

export function requireExternalApiConfirmation({ args, provider, estimatedRequests, freeLimit = 3 }) {
  if (process.env.GEWERKELISTE_ALLOW_EXTERNAL_API !== "true") {
    fail(`Externe API blockiert: Setze bewusst GEWERKELISTE_ALLOW_EXTERNAL_API=true fuer ${provider}.`);
  }

  const count = Number(estimatedRequests || 0);
  if (count <= freeLimit) return;

  const expected = `${normalizeAction(provider)}-${count}`;
  const cliConfirmation = stringValue(args["confirm-cost"]);
  const envConfirmation = stringValue(process.env.GEWERKELISTE_CONFIRM_COST);
  if (cliConfirmation === expected || envConfirmation === expected) return;

  fail(
    [
      `Externe API-Nutzung blockiert: ${provider}`,
      `Geschaetzte Requests: ${count}`,
      `Ohne Freigabe erlaubt: bis ${freeLimit}`,
      `Erforderlich: --confirm-cost ${expected}`,
      `Alternativ lokal: GEWERKELISTE_CONFIRM_COST=${expected}`,
    ].join("\n"),
  );
}

function isLocalSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function normalizeAction(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
