const PROTECTED_PATH_PREFIXES = ["/admin", "/planner", "/companies", "/trades"] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function parseBasicCredentials(authorization: string | null) {
  if (!authorization) return null;

  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
  if (!match) return null;

  try {
    const decoded = atob(match[1]);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

async function digestText(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function hasMatchingSecret(candidate: string, expected: string) {
  if (!candidate || !expected) return false;

  const [candidateDigest, expectedDigest] = await Promise.all([digestText(candidate), digestText(expected)]);
  let difference = 0;

  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= candidateDigest[index] ^ expectedDigest[index];
  }

  return difference === 0;
}

export async function isAuthorized(authorization: string | null, adminSecret: string) {
  const credentials = parseBasicCredentials(authorization);
  return credentials ? hasMatchingSecret(credentials.password, adminSecret) : false;
}
