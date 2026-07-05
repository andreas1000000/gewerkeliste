import Link from "next/link";
import type { Route } from "next";
import type { FaqEntry } from "@/lib/faq";

export function FaqTeaser({
  cta = "Alle häufigen Fragen ansehen",
  entries,
  eyebrow = "Häufige Fragen",
  title,
}: {
  cta?: string;
  entries: FaqEntry[];
  eyebrow?: string;
  title: string;
}) {
  if (!entries.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#07173d]">{title}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
              <h3 className="text-base font-semibold text-ink">{entry.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{entry.answer}</p>
              {entry.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.links.map((link) => (
                    <Link key={link.href} className="text-sm font-semibold text-action hover:underline" href={link.href as Route}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <div className="mt-5">
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action" href={"/faq" as Route}>
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
