import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";

export async function requireAdminAction() {
  const adminSecret = process.env.ADMIN_SECRET;
  const authorization = (await headers()).get("authorization");

  if (!adminSecret || !(await isAuthorized(authorization, adminSecret))) {
    throw new Error("Authentication required");
  }
}
