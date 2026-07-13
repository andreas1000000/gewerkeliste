"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function MagicLinkForm({ nextPath = "/mein-betrieb" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage("Wenn die Adresse zugelassen ist, wurde ein Anmeldelink versendet. Prüfen Sie bitte auch den Spam-Ordner.");
    } catch {
      setMessage("Der Anmeldelink konnte nicht angefordert werden. Bitte prüfen Sie die Adresse und versuchen Sie es erneut.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={requestLink}>
      <label className="grid gap-2 text-sm font-semibold text-ink">
        E-Mail-Adresse
        <input
          className="rounded-md border border-line px-3 py-2 font-normal outline-none focus:border-action"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <button className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Anmeldelink wird angefordert …" : "Anmeldelink senden"}
      </button>
      {message ? <p className="rounded-md border border-line bg-panel px-3 py-3 text-sm leading-6 text-muted">{message}</p> : null}
    </form>
  );
}
