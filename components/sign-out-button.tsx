"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-panel disabled:opacity-60"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      type="button"
    >
      {pending ? "Abmelden …" : "Abmelden"}
    </button>
  );
}
