export const internalRoles = ["admin", "internal_editor", "business_user", "public_user"] as const;

export type InternalRole = (typeof internalRoles)[number];

export type RequiredInternalRole = "admin";

export type InternalAccessPolicy = {
  requiredRole: RequiredInternalRole;
  authentication: "basic_secret";
  status: "active";
};

export const roleMatrix = [
  {
    role: "admin",
    status: "active",
    access: "Alle aktuell geschützten internen Pfade und Freigabeentscheidungen",
    authentication: "Basic Auth mit ADMIN_SECRET",
  },
  {
    role: "internal_editor",
    status: "planned",
    access: "Interne Bearbeitung ohne finale Freigabe",
    authentication: "Explizite Benutzeridentität und Berechtigung erforderlich",
  },
  {
    role: "business_user",
    status: "planned",
    access: "Eigene Betriebsdaten nach einem freigegebenen Claim-Prozess",
    authentication: "Explizite Benutzeridentität, Besitzbezug und Scope-Prüfung erforderlich",
  },
  {
    role: "public_user",
    status: "planned",
    access: "Öffentliche, freigegebene Verzeichnisdaten",
    authentication: "Keine Anmeldung erforderlich",
  },
] as const satisfies ReadonlyArray<{
  role: InternalRole;
  status: "active" | "planned";
  access: string;
  authentication: string;
}>;

const PROTECTED_PATH_PREFIXES = ["/admin", "/planner", "/companies", "/trades"] as const;

export function getRequiredRole(pathname: string): RequiredInternalRole | null {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ? "admin" : null;
}

export function getInternalAccessPolicy(pathname: string): InternalAccessPolicy | null {
  return getRequiredRole(pathname)
    ? {
        requiredRole: "admin",
        authentication: "basic_secret",
        status: "active",
      }
    : null;
}

export function isProtectedPath(pathname: string) {
  return getRequiredRole(pathname) !== null;
}

export function canAccessRequiredRole(role: InternalRole, requiredRole: RequiredInternalRole | null) {
  if (requiredRole === null) return true;
  return role === requiredRole;
}
