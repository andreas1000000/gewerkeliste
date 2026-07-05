import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { faqIntro, faqSections, fullFaqEntries, plainFaqAnswer } from "@/lib/faq";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "FAQ zu GewerkeListe.com | Betriebe, Gewerke und verifizierte Profile",
  description:
    "Antworten zu GewerkeListe.com: Wie Betriebe gefunden werden, wie das kostenlose Basisprofil funktioniert, was ein verifiziertes Startprofil enthält und wie Auftraggeber passende Fachbetriebe nach Gewerk, Leistung und Region finden.",
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FaqPage() {
  const entries = fullFaqEntries();
  const sections = faqSections(entries);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">FAQ</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-normal text-[#07173d] sm:text-5xl">
            Häufige Fragen zu GewerkeListe.com
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#30415f]">{faqIntro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand" href={"/betriebe" as Route}>
              Betriebe suchen
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action" href={"/betrieb-eintragen" as Route}>
              Betrieb eintragen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <nav className="h-fit rounded-lg border border-line bg-white p-5 shadow-soft lg:sticky lg:top-24" aria-label="FAQ Abschnitte">
          <h2 className="text-sm font-semibold uppercase tracking-normal text-muted">Abschnitte</h2>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-action">
            {sections.map((section) => (
              <a key={section.title} className="hover:underline" href={`#${sectionId(section.title)}`}>
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-8">
          {sections.map((section) => (
            <section key={section.title} id={sectionId(section.title)} className="scroll-mt-24 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-2xl font-semibold text-[#07173d]">{section.title}</h2>
              <div className="mt-5 grid gap-4">
                {section.items.map((entry) => (
                  <article key={entry.id} className="rounded-md border border-line bg-[#fbfcff] p-4">
                    <h3 className="text-lg font-semibold text-ink">{entry.question}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#30415f]">{entry.answer}</p>
                    {entry.links?.length ? (
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
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
            </section>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(entries)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd()) }}
      />
    </main>
  );
}

function faqJsonLd(entries: ReturnType<typeof fullFaqEntries>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteConfig.url}/faq#faq`,
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: plainFaqAnswer(entry),
      },
    })),
  };
}

function breadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: `${siteConfig.url}/faq`,
      },
    ],
  };
}

function webPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteConfig.url}/faq#webpage`,
    url: `${siteConfig.url}/faq`,
    name: "FAQ zu GewerkeListe.com",
    description:
      "Antworten zu GewerkeListe.com, kostenlosen Basisprofilen, verifizierten Profilen und der Suche nach Bau- und Handwerksbetrieben.",
    isPartOf: {
      "@type": "WebSite",
      name: "GewerkeListe.com",
      url: siteConfig.url,
    },
  };
}

function sectionId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
