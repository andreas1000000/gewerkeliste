import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { breadcrumbJsonLd, localBusinessJsonLd } from "../lib/seo.ts";
import {
  buildPublicProfileDescription,
  buildPublicProfileTitle,
  canonicalProfileUrl,
  publicJsonLdMediaUrl,
  publicProfileRobots,
} from "../lib/public-profile-seo.ts";
import { buildPublicServiceDisplay } from "../lib/public-profile-content.ts";
import {
  getPublicProfileEntitlements,
  isApprovedPublicStatus,
  isLocalFixtureCompanyRecord,
  isPublicCompanyNotFoundError,
  publicJsonLdSocialUrls,
  publicProfileRowsOrEmpty,
  publicReferenceClientName,
} from "../lib/public-profile-rules.ts";
import { evaluateLocalFixtureEnvironment } from "../scripts/local-fixture-guards.mjs";

const localFixtureEnv = {
  GEWERKELISTE_ENABLE_LOCAL_FIXTURES: "1",
  GEWERKELISTE_FIXTURE_ENV: "local",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NODE_ENV: "development",
};

test("local fixtures are disabled in production", () => {
  const result = evaluateLocalFixtureEnvironment({
    ...localFixtureEnv,
    NODE_ENV: "production",
  });

  assert.equal(result.allowed, false);
  assert.match(result.reasons.join(" "), /production/);
});

test("local fixtures fail closed for unknown environments", () => {
  const result = evaluateLocalFixtureEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });

  assert.equal(result.allowed, false);
  assert.match(result.reasons.join(" "), /GEWERKELISTE_ENABLE_LOCAL_FIXTURES/);
});

test("local fixtures require an explicit local target", () => {
  const result = evaluateLocalFixtureEnvironment(localFixtureEnv);

  assert.equal(result.allowed, true);
  assert.equal(result.target, "http://127.0.0.1:54321");
});

test("vercel preview profile metadata is noindex nofollow", () => {
  assert.deepEqual(publicProfileRobots({ VERCEL: "1", VERCEL_ENV: "preview" }), {
    index: false,
    follow: false,
  });
});

test("production profile metadata remains indexable", () => {
  assert.deepEqual(publicProfileRobots({ VERCEL: "1", VERCEL_ENV: "production" }), {
    index: true,
    follow: true,
  });
});

test("canonical profile URLs never use preview or localhost hosts", () => {
  const canonical = canonicalProfileUrl("metallteq-83101-rohrdorf");

  assert.equal(canonical, "https://gewerkeliste.com/firma/metallteq-83101-rohrdorf");
  assert.doesNotMatch(canonical, /localhost|127\.0\.0\.1|vercel\.app/);
});

test("metadata title and description use only stable profile facts", () => {
  assert.equal(
    buildPublicProfileTitle({ name: "MetallteQ", trade: "Metallbau", city: "Rohrdorf" }),
    "MetallteQ | Metallbau in Rohrdorf | GewerkeListe.com",
  );
  assert.match(
    buildPublicProfileDescription({ name: "MetallteQ", trade: "Metallbau", city: "Rohrdorf" }),
    /Informationen zu Leistungen, Standort und direkter Kontaktaufnahme/,
  );
});

test("local and signed media URLs are excluded from public metadata", () => {
  assert.equal(publicJsonLdMediaUrl("http://127.0.0.1:54321/storage/v1/object/sign/company-media/logo.png?token=abc"), undefined);
  assert.equal(publicJsonLdMediaUrl("https://example.supabase.co/storage/v1/object/sign/company-media/logo.png?token=abc"), undefined);
  assert.equal(publicJsonLdMediaUrl("https://example.com/logo.png"), "https://example.com/logo.png");
});

test("local business JSON-LD parses and includes required public fields", () => {
  const jsonLd = localBusinessJsonLd(sampleCompany(), "/firma/metallteq-83101-rohrdorf", "Metallbau in Rohrdorf");
  const parsed = JSON.parse(JSON.stringify(jsonLd));

  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(parsed["@type"], "LocalBusiness");
  assert.equal(parsed.name, "MetallteQ");
  assert.equal(parsed.mainEntityOfPage, "https://gewerkeliste.com/firma/metallteq-83101-rohrdorf");
  assert.equal(parsed.contactPoint["@type"], "ContactPoint");
});

test("public profile page does not render internal trade signal evidence", async () => {
  const source = await readFile("app/firma/[slug]/page.tsx", "utf8");

  assert.doesNotMatch(source, /Gewerkesignal/);
  assert.doesNotMatch(source, /Betriebseintrag:/);
  assert.doesNotMatch(source, /match\.evidence/);
  assert.doesNotMatch(source, /Datenquellen \/ Datenstatus/);
  assert.doesNotMatch(source, /GewerkeListe beschreibt Datenstatus/);
  assert.doesNotMatch(source, /title="Datenstatus"/);
  assert.doesNotMatch(source, /Datenstatus:/);
  assert.doesNotMatch(source, /Verifizierungskennzeichnung/);
  assert.match(source, /title="Leistungen"/);
  assert.match(source, /<ServiceGroups groups=\{serviceDisplay\.groups\}/);
});

test("trade evidence is excluded from public JSON-LD while confirmed trades and services remain", () => {
  const jsonLd = localBusinessJsonLd(
    {
      ...sampleCompany(),
      company_trades: [
        {
          status: "admin_confirmed",
          visibility_level: "verified_public",
          source: "submission",
          evidence: "Betriebseintrag: interner Rohtext mit wiederholten Gewerken und Leistungen",
          trades: { name: "Metallbau", slug: "metallbau" },
        },
      ],
      company_services: [
        {
          status: "confirmed",
          confidence_score: 100,
          source: "submission",
          evidence: "Evidence-Rohtext: Balkone, Gelaender und Stahlbau",
          services: { name: "Balkone", slug: "balkone" },
        },
      ],
    },
    "/firma/metallteq-83101-rohrdorf",
    "Metallbau in Rohrdorf",
  );
  const serialized = JSON.stringify(jsonLd);

  assert.doesNotMatch(serialized, /Betriebseintrag:/);
  assert.doesNotMatch(serialized, /Evidence-Rohtext/);
  assert.doesNotMatch(serialized, /submission/);
  assert.match(serialized, /Metallbau/);
  assert.match(serialized, /Balkone/);
});

test("JSON-LD does not contain local URLs, website sameAs, or unsafe links", () => {
  const jsonLd = localBusinessJsonLd(
    {
      ...sampleCompany(),
      website_url: "http://127.0.0.1:3001",
      logo_url: "http://127.0.0.1:54321/storage/v1/object/sign/company-media/logo.png?token=abc",
      premium_profile: {
        socialLinks: [
          { url: "https://www.linkedin.com/company/metallteq" },
          { url: "javascript:alert(1)" },
        ],
      },
    },
    "/firma/metallteq-83101-rohrdorf",
    "Metallbau in Rohrdorf",
  );
  const serialized = JSON.stringify(jsonLd);

  assert.doesNotMatch(serialized, /127\.0\.0\.1|localhost|javascript:/);
  assert.deepEqual(jsonLd.sameAs, ["https://www.linkedin.com/company/metallteq"]);
});

test("breadcrumb JSON-LD is valid and points at production URLs", () => {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Startseite", path: "/" },
    { name: "Betriebe", path: "/betriebe" },
    { name: "MetallteQ", path: "/firma/metallteq-83101-rohrdorf" },
  ]);

  assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.equal(breadcrumb.itemListElement[0].position, 1);
  assert.equal(breadcrumb.itemListElement[2].item, "https://gewerkeliste.com/firma/metallteq-83101-rohrdorf");
});

test("private reference client names remain excluded", () => {
  assert.equal(publicReferenceClientName("Privater Auftraggeber", false), null);
});

test("unsafe social links are excluded", () => {
  assert.deepEqual(publicJsonLdSocialUrls([{ url: "javascript:alert(1)" }, { url: "https://instagram.com/metallteq" }]), [
    "https://instagram.com/metallteq",
  ]);
});

test("basis and sparse profiles work without extension modules", () => {
  const entitlements = getPublicProfileEntitlements({
    profile_package: "basis",
    verified: false,
    premium_profile: {
      contacts: [],
      teamMembers: [],
      references: [],
      referenceMedia: [],
      certificates: [],
      socialLinks: [],
      profileSections: [],
    },
  });

  assert.equal(entitlements.modules.baseProfile, true);
  assert.equal(entitlements.modules.contacts, false);
  assert.equal(entitlements.modules.references, false);
  assert.equal(entitlements.modules.certificates, false);
});

test("temporary module errors do not equal a not-found company", () => {
  assert.deepEqual(publicProfileRowsOrEmpty([{ id: "hidden" }], { code: "500", message: "temporary failure" }), []);
  assert.equal(isPublicCompanyNotFoundError({ code: "500", message: "temporary failure" }), false);
});

test("a genuinely missing public profile is recognized as not found", () => {
  assert.equal(isPublicCompanyNotFoundError({ code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" }), true);
});

test("unknown review status values are not public", () => {
  assert.equal(isApprovedPublicStatus("approved"), true);
  assert.equal(isApprovedPublicStatus("archived"), false);
  assert.equal(isApprovedPublicStatus(undefined), false);
});

test("local fixture records are excluded from public search and sitemap inputs", () => {
  assert.equal(
    isLocalFixtureCompanyRecord({
      trust_badge: "phase3-local-fixture",
      voluntary_support_status: "local-test",
      email: "phase3-metallteq@example.invalid",
      description: "Lokale Phase-3-Testdaten: Vollstaendiges verifiziertes Profil.",
    }),
    true,
  );
  assert.equal(isLocalFixtureCompanyRecord({ name: "Echter Betrieb", email: "kontakt@example.com" }), false);
});

test("real company routes reject local fixture records before public rendering", async () => {
  const source = await readFile("lib/data/public-directory.ts", "utf8");

  assert.match(source, /if \(isLocalFixtureCompanyRecord\(company\)\) return null;/);
  assert.match(source, /if \(isLocalFixtureCompanyRecord\(raw\)\) return null;/);
  assert.doesNotMatch(source, /isIndexableProductionEnvironment\(\) && isLocalFixtureCompanyRecord/);
});

test("JSON-LD test data is blocked by excluding fixture records from company routes", async () => {
  const source = await readFile("lib/data/public-directory.ts", "utf8");

  assert.match(source, /applyApprovedSubmissionPublicDetails/);
  assert.match(source, /isLocalFixtureCompanyRecord\(company\)/);
  assert.match(source, /isLocalFixtureCompanyRecord\(raw\)/);
  assert.match(source, /isLocalFixtureSubmissionRecord/);
  assert.match(source, /user_agent/);
});

test("primary contact card is not repeated for a single structured contact", async () => {
  const source = await readFile("app/firma/[slug]/page.tsx", "utf8");

  assert.match(source, /const primaryContact = getPrimaryProfileContact\(company, premiumProfile\.contacts\);/);
  assert.match(source, /\{multipleContacts\.length > 1 \?/);
});

test("public profile services show all confirmed and submitted items without a visible cap", () => {
  const confirmedServices = Array.from({ length: 29 }, (_, index) => ({
    status: "confirmed",
    confidence_score: 100 - index,
    source: "test",
    services: {
      id: `service-${index}`,
      name: `Bestätigte Leistung ${index + 1}`,
      slug: `bestaetigte-leistung-${index + 1}`,
      service_families: {
        name: index < 15 ? "Metallbau" : "Sonderbau",
        slug: index < 15 ? "metallbau" : "sonderbau",
        trades: { name: "Metallbau", slug: "metallbau" },
      },
    },
  }));

  const display = buildPublicServiceDisplay({
    company_services: confirmedServices,
    selected_services: ["Bestätigte Leistung 1", "Sonderanfertigung"],
    specializations: ["Designmetallbau"],
    description: "Leistungen: Sollte nicht benutzt werden, wenn Struktur vorhanden ist.",
  });

  assert.equal(display.totalCount, 31);
  assert.equal(display.groups.flatMap((group) => group.items).length, 31);
  assert.equal(display.groups.flatMap((group) => group.items).at(-1)?.label, "Designmetallbau");
  assert.match(display.sourceLabel, /Strukturierte und freigegebene Leistungen/);
});

test("public profile services fall back to approved submission services for basis profiles", () => {
  const display = buildPublicServiceDisplay({
    company_services: [],
    selected_services: ["Balkone", "Treppen", "Balkone"],
    specializations: ["Geländerbau"],
    description: null,
  });

  assert.equal(display.totalCount, 3);
  assert.deepEqual(display.groups.flatMap((group) => group.items.map((item) => item.label)), [
    "Balkone",
    "Treppen",
    "Geländerbau",
  ]);
  assert.match(display.sourceLabel, /Betriebseintrag/);
});

function sampleCompany() {
  return {
    name: "MetallteQ",
    slug: "metallteq-83101-rohrdorf",
    website_url: "https://www.metallteq.de",
    phone: "+49 8032 000001",
    email: "kontakt@metallteq.de",
    logo_url: "https://assets.example.com/metallteq-logo.png",
    profile_image_url: "https://assets.example.com/metallteq-team.png",
    street: "Testweg 1",
    postal_code: "83101",
    city: "Rohrdorf",
    service_regions: ["Rosenheim"],
    service_countries: ["Deutschland"],
    trades: { name: "Metallbau", slug: "metallbau" },
    company_trades: [
      {
        status: "admin_confirmed",
        visibility_level: "verified_public",
        trades: { name: "Metallbau", slug: "metallbau" },
      },
    ],
    company_services: [
      {
        status: "confirmed",
        services: { name: "Treppengeländer", slug: "treppengelaender" },
      },
    ],
    premium_profile: {
      socialLinks: [{ url: "https://www.linkedin.com/company/metallteq" }],
    },
  };
}
