export const LOCAL_FIXTURE_ENABLE_FLAG = "GEWERKELISTE_ENABLE_LOCAL_FIXTURES";
export const LOCAL_FIXTURE_ENV_FLAG = "GEWERKELISTE_FIXTURE_ENV";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function evaluateLocalFixtureEnvironment(env = process.env) {
  const reasons = [];
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  let parsedUrl = null;

  if (env[LOCAL_FIXTURE_ENABLE_FLAG] !== "1") {
    reasons.push(`${LOCAL_FIXTURE_ENABLE_FLAG} muss explizit auf 1 gesetzt sein.`);
  }

  if (env[LOCAL_FIXTURE_ENV_FLAG] !== "local") {
    reasons.push(`${LOCAL_FIXTURE_ENV_FLAG} muss explizit local sein.`);
  }

  if (!supabaseUrl) {
    reasons.push("NEXT_PUBLIC_SUPABASE_URL fehlt.");
  } else {
    try {
      parsedUrl = new URL(supabaseUrl);
    } catch {
      reasons.push("NEXT_PUBLIC_SUPABASE_URL ist keine gueltige URL.");
    }
  }

  if (parsedUrl) {
    if (!LOCAL_HOSTS.has(parsedUrl.hostname)) {
      reasons.push(`Supabase-Ziel ist nicht lokal (${parsedUrl.hostname}).`);
    }
    if (parsedUrl.protocol !== "http:") {
      reasons.push(`Lokale Supabase-URL muss http verwenden (${parsedUrl.protocol}).`);
    }
    if (parsedUrl.port && parsedUrl.port !== "54321") {
      reasons.push(`Unerwarteter lokaler Supabase-Port ${parsedUrl.port}.`);
    }
  }

  if (env.NODE_ENV === "production") {
    reasons.push("NODE_ENV=production ist fuer lokale Fixtures gesperrt.");
  }

  if (env.VERCEL === "1" || env.VERCEL_ENV) {
    reasons.push("Vercel-Umgebungen sind fuer lokale Fixtures gesperrt.");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    target: parsedUrl ? `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ""}` : null,
  };
}

export function assertLocalFixtureEnvironment(env = process.env) {
  const result = evaluateLocalFixtureEnvironment(env);
  if (!result.allowed) {
    throw new Error(`Lokale Fixture-Erstellung abgebrochen: ${result.reasons.join(" ")}`);
  }
  return result;
}
