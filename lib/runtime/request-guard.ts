export function isAdminProtectedPathname(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/trades")
  );
}
