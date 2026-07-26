import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPageContent } from "@/lib/data/site-pages";
import { getPageSection } from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Warum GewerkeListe.com entsteht | Über uns",
  description:
    "GewerkeListe.com entsteht aus echter Baupraxis, um passende Bau- und Handwerksbetriebe besser auffindbar zu machen und mehr Transparenz in den Markt zu bringen.",
  alternates: {
    canonical: "/ueber-gewerkeliste",
  },
};

const trustItems = [
  "Gelernter Maurer",
  "Bauingenieur",
  "Bauherrenvertretung",
  "Planung und Projektsteuerung",
  "Erfahrung aus Auftraggeber- und Ausführungsperspektive",
  "Aus der Region Rosenheim",
];

export default async function AboutGewerkeListePage() {
  const pageContent = await getPublishedPageContent("about");
  const trustSection = getPageSection(pageContent, "about-trust");
  const problemSection = getPageSection(pageContent, "about-problem");
  const observationSection = getPageSection(pageContent, "about-observation");
  const positioningSection = getPageSection(pageContent, "about-positioning");
  const boundarySection = getPageSection(pageContent, "about-boundary");
  const benefitSection = getPageSection(pageContent, "about-benefit");
  const buildSection = getPageSection(pageContent, "about-build");
  const financeSection = getPageSection(pageContent, "about-finance");
  const personalSection = getPageSection(pageContent, "about-personal");
  const joinSection = getPageSection(pageContent, "about-join");

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-ink">
      <SiteHeader />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
          <Link className="hover:text-ink" href={"/" as Route}>
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink">Über GewerkeListe.com</span>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-brand">{pageContent.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-brand sm:text-5xl">
              {pageContent.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink">
              {pageContent.intro}
            </p>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-7 text-ink">
              <p>
                Mein Name ist Andreas Moser. Ich bin gelernter Maurer, Bauingenieur und arbeite seit vielen Jahren auf
                Auftraggeberseite in der Planung, Steuerung und Umsetzung von Bauprojekten.
              </p>
              <p>Ich kenne die Frage aus der Praxis:</p>
              <p className="rounded-lg border border-line bg-panel px-5 py-4 text-xl font-semibold text-brand">
                „Kennst du jemanden, der das machen kann?“
              </p>
              <p>Genau aus dieser Frage heraus entsteht GewerkeListe.com.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <BlueLink href={pageContent.primaryHref as Route}>{pageContent.primaryLabel}</BlueLink>
              <OutlineLink href={pageContent.secondaryHref as Route}>{pageContent.secondaryLabel}</OutlineLink>
            </div>
          </div>

          <aside className="rounded-lg border border-line bg-panel p-6 shadow-soft">
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <img
                alt="Andreas Moser, Gründer von GewerkeListe.com"
                className="aspect-square w-full object-cover"
                src="/images/andreas-moser.png"
              />
            </div>
            <div className="mt-5 rounded-lg border border-line bg-white p-5">
              <p className="text-lg font-semibold text-ink">Andreas Moser</p>
              <p className="mt-1 text-sm text-muted">Gelernter Maurer | Bauingenieur | Bauherrenvertreter</p>
              <a
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-action hover:border-action"
                href="https://www.linkedin.com/in/andreasmoserrealestate/"
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn-Profil
              </a>
            </div>
          </aside>
        </div>
      </section>

      {trustSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-brand">{trustSection.title}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(trustSection.items.length ? trustSection.items : trustItems.map((item) => ({ label: item, detail: "" }))).map((item) => (
            <Fact key={item.label}>{item.label}</Fact>
          ))}
        </div>
      </section> : null}

      {problemSection?.enabled ? <TwoColumnSection
        eyebrow={problemSection.eyebrow}
        title={problemSection.title}
        body={<>{problemSection.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>}
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Woran es häufig scheitert</h3>
            <div className="mt-4 grid gap-3">
              {problemSection.items.map((item) => (
                  <Fact key={item.label}>{item.label}</Fact>
                ),
              )}
            </div>
          </Card>
        }
      /> : null}

      {observationSection?.enabled ? <TwoColumnSection
        eyebrow={observationSection.eyebrow}
        title={observationSection.title}
        body={<>{observationSection.body.split("\n\n").map((paragraph, index) => <p key={paragraph} className={index === observationSection.body.split("\n\n").length - 1 ? "font-semibold text-action" : undefined}>{paragraph}</p>)}</>}
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Was sichtbar werden soll</h3>
            <div className="mt-4 grid gap-3">
              {observationSection.items.map((item) => (
                <Fact key={item.label}>{item.label}</Fact>
              ))}
            </div>
          </Card>
        }
      /> : null}

      {positioningSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{positioningSection.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">{positioningSection.title}</h2>
          <div className="mt-5 max-w-4xl space-y-4 whitespace-pre-line text-base leading-7 text-ink">{positioningSection.body}</div>
        </div>
      </section>
      : null}

      {boundarySection?.enabled ? <TwoColumnSection
        eyebrow={boundarySection.eyebrow}
        title={boundarySection.title}
        body={<>{boundarySection.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>}
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Transparenz heißt konkret</h3>
            <div className="mt-4 grid gap-3">
              {boundarySection.items.map((item) => (
                <Fact key={item.label}>{item.label}</Fact>
              ))}
            </div>
          </Card>
        }
      /> : null}

      {benefitSection?.enabled ? <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{benefitSection.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">{benefitSection.title}</h2>
          <p className="mt-5 max-w-4xl whitespace-pre-line text-base leading-7 text-ink">{benefitSection.body}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefitSection.items.map((item) => (
              <Fact key={item.label}>{item.label}</Fact>
            ))}
          </div>
        </div>
      </section> : null}

      {buildSection?.enabled ? <TwoColumnSection
        eyebrow={buildSection.eyebrow}
        title={buildSection.title}
        body={<>{buildSection.body.split("\n\n").map((paragraph, index) => <p key={paragraph} className={index === buildSection.body.split("\n\n").length - 1 ? "font-semibold text-action" : undefined}>{paragraph}</p>)}</>}
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Gebaut für</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {buildSection.items.map((item) => (
                <span key={item.label} className="rounded-full border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink">
                  {item.label}
                </span>
              ))}
            </div>
          </Card>
        }
      /> : null}

      {financeSection?.enabled ? <TwoColumnSection
        eyebrow={financeSection.eyebrow}
        title={financeSection.title}
        body={<>{financeSection.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>}
        aside={
          <Card>
            <h3 className="text-lg font-semibold text-ink">Möglicher Zusatznutzen</h3>
            <div className="mt-4 grid gap-3">
              {financeSection.items.map((item) => (
                <Fact key={item.label}>{item.label}</Fact>
              ))}
            </div>
          </Card>
        }
      /> : null}

      {personalSection?.enabled ? <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">{personalSection.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand">{personalSection.title}</h2>
          <div className="mt-5 space-y-4 whitespace-pre-line text-base leading-7 text-ink">{personalSection.body}</div>
          <div className="mt-6 rounded-lg border border-line bg-panel p-5">
            <p className="text-base font-semibold text-brand">{personalSection.items[0]?.label || "Andreas Moser"}</p>
            <p className="mt-1 text-sm text-muted">{personalSection.items[0]?.detail}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold text-brand">„Gute Betriebe sollen gefunden werden.“</h2>
          <p className="mt-5 text-lg leading-8 text-ink">
            Gute Betriebe sollen gefunden werden, weil sie gute Arbeit leisten und die passende Leistung anbieten, nicht
            nur, weil zufällig jemand ihre Telefonnummer kennt.
          </p>
        </Card>
      </section> : null}

      {joinSection?.enabled ? <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#082a63] p-6 text-white shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-100">{joinSection.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold">{joinSection.title}</h2>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-blue-50">{joinSection.body}</p>
          </div>
          <div className="mt-6 grid gap-3 lg:mt-0">
            <WhiteLink href={(joinSection.primaryHref || "/betrieb-eintragen") as Route}>{joinSection.primaryLabel || "Betrieb eintragen"}</WhiteLink>
            <WhiteOutlineLink href={(joinSection.secondaryHref || "/betrieb-eintragen") as Route}>{joinSection.secondaryLabel || "Fehlenden Betrieb melden"}</WhiteOutlineLink>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/45 px-5 text-sm font-semibold text-white hover:bg-white/10"
              href="mailto:kontakt@gewerkeliste.com?subject=Feedback%20zu%20GewerkeListe.com"
            >
              Feedback geben
            </a>
          </div>
        </div>
      </section> : null}
    </main>
  );
}

function TwoColumnSection({
  eyebrow,
  title,
  body,
  aside,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  aside: ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-normal text-brand">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold text-brand">{title}</h2>
        <div className="mt-5 space-y-4 text-base leading-7 text-ink">{body}</div>
      </Card>
      {aside}
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">{children}</section>;
}

function Fact({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3 text-sm font-medium leading-6 text-ink">
      <span className="mr-2 font-semibold text-brand">✓</span>
      {children}
    </div>
  );
}

function BlueLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-semibold text-white hover:bg-brand"
      href={href}
    >
      {children}
    </Link>
  );
}

function OutlineLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-action hover:border-action"
      href={href}
    >
      {children}
    </Link>
  );
}

function WhiteLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-brand hover:bg-blue-50"
      href={href}
    >
      {children}
    </Link>
  );
}

function WhiteOutlineLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/45 px-5 text-sm font-semibold text-white hover:bg-white/10"
      href={href}
    >
      {children}
    </Link>
  );
}
