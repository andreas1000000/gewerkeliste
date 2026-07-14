import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthorized } from "@/lib/admin-auth";

/** Re-check the existing Basic Auth boundary at the Server Action boundary. */
export async function requireAdminAction() {
  const adminSecret = process.env.ADMIN_SECRET;
  const authorization = (await headers()).get("authorization");
  if (!adminSecret || !(await isAuthorized(authorization, adminSecret))) redirect("/admin");
}
