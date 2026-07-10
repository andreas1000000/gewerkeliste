#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const COMPANY_MEDIA_BUCKET = "company-media";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const FIXTURE_SLUGS = [
  "metallteq-83101-rohrdorf",
  "angerer-elektrotechnik-83083-riedering",
  "antal-zoltan-schlosserei-gmbh-83083-riedering",
  "wagner-und-spielvogel-gbr-83083-riedering",
];
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

await loadEnvFile(".env.local");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assertLocalSupabaseTarget(supabaseUrl);
if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY fehlt fuer die lokale Fixture-Erstellung.");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const tradeRows = await upsertRows(
  "trades",
  [
    { name: "Metallbau", slug: "metallbau" },
    { name: "Elektrotechnik", slug: "elektrotechnik" },
    { name: "Schlosserei", slug: "schlosserei" },
    { name: "Bauunternehmen", slug: "bauunternehmen" },
  ],
  "slug",
  "id, slug",
);
const trades = new Map(tradeRows.map((trade) => [trade.slug, trade.id]));
const assets = await uploadFixtureAssets();

await deleteExistingFixtureCompanies();
const companyRows = await upsertRows("companies", fixtureCompanies(trades, assets), "slug", "id, slug, name");
const companies = new Map(companyRows.map((company) => [company.slug, company]));

await insertRows("company_trades", companyTradeRows(companies, trades));
await insertRows("company_submissions", submissionRows(companies));
await insertRows("company_contacts", contactRows(companies, assets));
await insertRows("company_team_members", teamRows(companies, assets));
await insertRows("company_references", referenceRows(companies));
const references = await selectRows("company_references", "id, company_id, title");
await insertRows("company_reference_media", referenceMediaRows(companies, references, assets));
await insertRows("company_certificates", certificateRows(companies));
await insertRows("company_social_links", socialLinkRows(companies));
await insertRows("company_profile_sections", profileSectionRows(companies));

console.log(JSON.stringify({
  status: "ok",
  target: safeTargetSummary(supabaseUrl),
  slugs: FIXTURE_SLUGS,
}, null, 2));

async function loadEnvFile(filePath) {
  let content = "";
  try {
    content = await readFile(path.join(process.cwd(), filePath), "utf8");
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function assertLocalSupabaseTarget(value) {
  if (!value) fail("NEXT_PUBLIC_SUPABASE_URL fehlt.");

  let url;
  try {
    url = new URL(value);
  } catch {
    fail("NEXT_PUBLIC_SUPABASE_URL ist keine gueltige URL.");
  }

  if (!LOCAL_HOSTS.has(url.hostname)) fail(`Abbruch: Supabase-Ziel ist nicht lokal (${url.hostname}).`);
  if (url.protocol !== "http:") fail(`Abbruch: Lokale Supabase-URL muss http verwenden (${url.protocol}).`);
  if (url.port && url.port !== "54321") fail(`Abbruch: unerwarteter lokaler Supabase-Port ${url.port}.`);
  if (process.env.NODE_ENV === "production") fail("Abbruch: NODE_ENV=production.");
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1") fail("Abbruch: Vercel/Production-Umgebung erkannt.");
}

function safeTargetSummary(value) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
}

async function uploadFixtureAssets() {
  const uploads = {};
  for (const slug of FIXTURE_SLUGS) {
    uploads[`${slug}:logo`] = `phase3-local/${slug}/logo.png`;
    uploads[`${slug}:person`] = `phase3-local/${slug}/person.png`;
    uploads[`${slug}:referenceA`] = `phase3-local/${slug}/reference-a.png`;
    uploads[`${slug}:referenceB`] = `phase3-local/${slug}/reference-b.png`;
  }

  for (const storagePath of Object.values(uploads)) {
    const { error } = await supabase.storage
      .from(COMPANY_MEDIA_BUCKET)
      .upload(storagePath, PNG_1X1, {
        contentType: "image/png",
        upsert: true,
      });
    if (error) fail(`Storage-Upload fehlgeschlagen (${storagePath}): ${error.message}`);
  }

  return uploads;
}

async function deleteExistingFixtureCompanies() {
  const submissionDelete = await supabase.from("company_submissions").delete().eq("user_agent", "phase3-local-fixture");
  if (submissionDelete.error) fail(`Alte lokale Phase-3-Submission-Fixtures konnten nicht geloescht werden: ${submissionDelete.error.message}`);

  const { error } = await supabase.from("companies").delete().in("slug", FIXTURE_SLUGS);
  if (error) fail(`Alte lokale Phase-3-Fixtures konnten nicht geloescht werden: ${error.message}`);
}

function fixtureCompanies(trades, assets) {
  return [
    {
      trade_id: requiredTrade(trades, "metallbau"),
      name: "MetallteQ",
      slug: "metallteq-83101-rohrdorf",
      description:
        "Lokale Phase-3-Testdaten: Vollstaendiges verifiziertes Profil fuer Metallbau, Design und Montage.",
      contact_name: "Johannes Lechner",
      email: "phase3-metallteq@example.invalid",
      phone: "+49 8032 000001",
      website_url: "https://www.metallteq.de",
      street: "Phase-3-Testweg 1",
      city: "Rohrdorf",
      postal_code: "83101",
      latitude: 47.797,
      longitude: 12.171,
      public_visible: true,
      claim_status: "claimed",
      verified: true,
      logo_url: assets["metallteq-83101-rohrdorf:logo"],
      banner_image_url: null,
      profile_image_url: assets["metallteq-83101-rohrdorf:person"],
      profile_image_alt: "Johannes Lechner, lokaler Phase-3-Testkontakt",
      gallery_image_urls: [],
      is_free_founding_member: true,
      trust_badge: "phase3-local-fixture",
      voluntary_support_status: "local-test",
      profile_status: "verified",
      verification_date: "2026-07-10T00:00:00Z",
      image_consent_given: true,
      image_consent_timestamp: "2026-07-10T00:00:00Z",
      service_radius_km: 80,
      service_regions: ["Chiemgau", "Rosenheim", "Inntal"],
      service_postal_codes: ["83083", "83101", "83022"],
      service_countries: ["Deutschland", "Oesterreich"],
      references_text: "Lokale Phase-3-Testreferenzen sind strukturiert hinterlegt.",
      memberships: ["Lokaler Testverband Metallbau"],
      certificates: ["Phase-3-Testnachweis Eigenangabe"],
      manufacturer_certificates: ["Phase-3-Test Herstellerzertifikat"],
      profile_package: "verified_start",
      premium_started_at: "2026-07-10T00:00:00Z",
    },
    {
      trade_id: requiredTrade(trades, "elektrotechnik"),
      name: "Angerer Elektrotechnik",
      slug: "angerer-elektrotechnik-83083-riedering",
      description: "Lokale Phase-3-Testdaten: Sparse-Profil mit einem Kontaktweg und ohne Zusatzmodule.",
      contact_name: null,
      email: null,
      phone: "+49 8036 000002",
      website_url: null,
      street: null,
      city: "Riedering",
      postal_code: "83083",
      latitude: 47.838,
      longitude: 12.208,
      public_visible: true,
      claim_status: "unclaimed",
      verified: false,
      logo_url: null,
      banner_image_url: null,
      profile_image_url: null,
      profile_image_alt: null,
      gallery_image_urls: [],
      is_free_founding_member: false,
      trust_badge: null,
      voluntary_support_status: null,
      profile_status: "imported",
      verification_date: null,
      image_consent_given: false,
      image_consent_timestamp: null,
      service_radius_km: null,
      service_regions: [],
      service_postal_codes: [],
      service_countries: [],
      references_text: null,
      memberships: [],
      certificates: [],
      manufacturer_certificates: [],
      profile_package: "basis",
    },
    {
      trade_id: requiredTrade(trades, "schlosserei"),
      name: "Antal-Zoltan Schlosserei GmbH",
      slug: "antal-zoltan-schlosserei-gmbh-83083-riedering",
      description: "Lokale Phase-3-Testdaten: Basisprofil ohne kostenpflichtige Zusatzmodule.",
      contact_name: "Herr Antal-Zoltan",
      email: "phase3-antal@example.invalid",
      phone: null,
      website_url: null,
      street: "Phase-3-Teststrasse 3",
      city: "Riedering",
      postal_code: "83083",
      latitude: 47.84,
      longitude: 12.21,
      public_visible: true,
      claim_status: "unclaimed",
      verified: false,
      logo_url: null,
      banner_image_url: null,
      profile_image_url: null,
      profile_image_alt: null,
      gallery_image_urls: [],
      is_free_founding_member: false,
      trust_badge: null,
      voluntary_support_status: null,
      profile_status: "imported",
      verification_date: null,
      image_consent_given: false,
      image_consent_timestamp: null,
      service_radius_km: 25,
      service_regions: ["Riedering"],
      service_postal_codes: ["83083"],
      service_countries: ["Deutschland"],
      references_text: null,
      memberships: [],
      certificates: [],
      manufacturer_certificates: [],
      profile_package: "basis",
    },
    {
      trade_id: requiredTrade(trades, "bauunternehmen"),
      name: "Wagner und Spielvogel GbR",
      slug: "wagner-und-spielvogel-gbr-83083-riedering",
      description: "Lokale Phase-3-Testdaten: Referenzprofil mit zugeordneten Projekten und Medien.",
      contact_name: "Wagner und Spielvogel",
      email: "phase3-wagner@example.invalid",
      phone: "+49 8036 000004",
      website_url: "https://www.wagner-spielvogel.de",
      street: "Phase-3-Bauweg 4",
      city: "Riedering",
      postal_code: "83083",
      latitude: 47.842,
      longitude: 12.207,
      public_visible: true,
      claim_status: "claimed",
      verified: true,
      logo_url: assets["wagner-und-spielvogel-gbr-83083-riedering:logo"],
      banner_image_url: null,
      profile_image_url: null,
      profile_image_alt: null,
      gallery_image_urls: [],
      is_free_founding_member: false,
      trust_badge: "phase3-local-fixture",
      voluntary_support_status: "local-test",
      profile_status: "verified",
      verification_date: "2026-07-10T00:00:00Z",
      image_consent_given: false,
      image_consent_timestamp: null,
      service_radius_km: 60,
      service_regions: ["Rosenheim", "Chiemgau"],
      service_postal_codes: ["83083", "83022"],
      service_countries: ["Deutschland"],
      references_text: "Lokale Phase-3-Testreferenzen sind strukturiert hinterlegt.",
      memberships: [],
      certificates: [],
      manufacturer_certificates: [],
      profile_package: "verified_start",
      premium_started_at: "2026-07-10T00:00:00Z",
    },
  ];
}

function companyTradeRows(companies, trades) {
  return [
    companyTrade(companies, trades, "metallteq-83101-rohrdorf", "metallbau", "Metallbau lokal bestaetigt"),
    companyTrade(companies, trades, "angerer-elektrotechnik-83083-riedering", "elektrotechnik", "Elektrotechnik lokal bestaetigt"),
    companyTrade(companies, trades, "antal-zoltan-schlosserei-gmbh-83083-riedering", "schlosserei", "Schlosserei lokal bestaetigt"),
    companyTrade(companies, trades, "wagner-und-spielvogel-gbr-83083-riedering", "bauunternehmen", "Bauunternehmen lokal bestaetigt"),
  ];
}

function companyTrade(companies, trades, companySlug, tradeSlug, evidence) {
  return {
    company_id: requiredCompany(companies, companySlug).id,
    trade_id: requiredTrade(trades, tradeSlug),
    confidence_score: 99,
    source: "phase3-local-fixture",
    evidence,
    status: "admin_confirmed",
    visibility_level: "verified_public",
  };
}

function submissionRows(companies) {
  return [
    submission(companies, "metallteq-83101-rohrdorf", "MetallteQ", "Metallbau", [
      "Balkongelaender",
      "Treppen",
      "Loftwand",
      "Vordach",
      "Edelstahlkonstruktion",
    ]),
    submission(companies, "angerer-elektrotechnik-83083-riedering", "Angerer Elektrotechnik", "Elektrotechnik", [
      "Elektroinstallation",
    ]),
    submission(companies, "antal-zoltan-schlosserei-gmbh-83083-riedering", "Antal-Zoltan Schlosserei GmbH", "Schlosserei", [
      "Schlosserarbeiten",
    ]),
    submission(companies, "wagner-und-spielvogel-gbr-83083-riedering", "Wagner und Spielvogel GbR", "Bauunternehmen", [
      "Umbau",
      "Sanierung",
      "Aussenanlagen",
    ]),
  ];
}

function submission(companies, companySlug, companyName, primaryTrade, services) {
  const company = requiredCompany(companies, companySlug);
  return {
    status: "approved",
    company_name: companyName,
    legal_form: null,
    website: null,
    phone: null,
    email: `phase3-${companySlug}@example.invalid`,
    contact_email: null,
    contact_first_name: null,
    contact_last_name: null,
    contact_role: null,
    contact_person_email: null,
    contact_person_phone: null,
    street: null,
    house_number: null,
    postal_code: companySlug.includes("83101") ? "83101" : "83083",
    city: companySlug.includes("rohrdorf") ? "Rohrdorf" : "Riedering",
    region: "Oberbayern",
    country: "Deutschland",
    primary_trade: primaryTrade,
    secondary_trades: [],
    selected_services: services,
    specializations: ["Lokale Phase-3-Testdaten"],
    service_radius_km: 35,
    service_regions: ["Rosenheim"],
    postal_codes: ["83083"],
    service_countries: ["Deutschland"],
    short_description: `Lokale Phase-3-Testdaten fuer ${companyName}.`,
    description: "Diese Angaben wurden ausschliesslich lokal fuer die Phase-3-Verifikation erzeugt.",
    references_text: null,
    memberships: [],
    certificates: [],
    manufacturer_certificates: [],
    wants_founder_verification: false,
    wants_support_contribution: false,
    support_contribution_amount: null,
    support_invoice_requested: false,
    consent_authorized: true,
    consent_data_correct: true,
    consent_privacy: true,
    source: `profile-update:${company.id}`,
    user_agent: "phase3-local-fixture",
    premium_submission_payload: {
      requested: false,
      contacts: [],
      team_members: [],
      references: [],
      reference_media: [],
      certificates: [],
      social_links: [],
      profile_sections: [],
    },
  };
}

function contactRows(companies, assets) {
  const metallteq = requiredCompany(companies, "metallteq-83101-rohrdorf").id;
  return [
    {
      company_id: metallteq,
      name: "Johannes Lechner",
      role: "Ansprechpartner Metallbau",
      responsibility_area: "Beratung, Angebot und Projektkoordination",
      phone: "+49 8032 000011",
      email: "phase3-johannes@example.invalid",
      image_url: assets["metallteq-83101-rohrdorf:person"],
      primary_contact_method: "email",
      sort_order: 1,
      is_primary: true,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      name: "Phase3 Zweitkontakt",
      role: "Projektabwicklung",
      responsibility_area: "Montageplanung und Rueckfragen",
      phone: "+49 8032 000012",
      email: "phase3-projekt@example.invalid",
      image_url: null,
      primary_contact_method: "phone",
      sort_order: 2,
      is_primary: false,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      name: "Pending Kontakt darf nicht erscheinen",
      role: "Nicht freigegeben",
      responsibility_area: null,
      phone: "+49 8032 999999",
      email: "pending-contact@example.invalid",
      image_url: assets["metallteq-83101-rohrdorf:person"],
      primary_contact_method: "email",
      sort_order: 99,
      is_primary: false,
      review_status: "pending",
    },
    {
      company_id: requiredCompany(companies, "wagner-und-spielvogel-gbr-83083-riedering").id,
      name: "Phase3 Referenzkontakt",
      role: "Projektkoordination",
      responsibility_area: "Referenzprojekte",
      phone: "+49 8036 000014",
      email: "phase3-wagner-kontakt@example.invalid",
      image_url: null,
      primary_contact_method: "phone",
      sort_order: 1,
      is_primary: true,
      review_status: "approved",
    },
  ];
}

function teamRows(companies, assets) {
  const metallteq = requiredCompany(companies, "metallteq-83101-rohrdorf").id;
  return [
    {
      company_id: metallteq,
      name: "Phase3 Werkstattteam",
      role: "Fertigung",
      department: "Metallbau Werkstatt",
      description: "Lokales Test-Teammitglied fuer die oeffentliche Darstellung.",
      image_url: assets["metallteq-83101-rohrdorf:person"],
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      name: "Phase3 Montageteam",
      role: "Montage",
      department: "Aussenmontage",
      description: "Lokales Test-Teammitglied mit Abteilungsangabe.",
      image_url: null,
      sort_order: 2,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      name: "Pending Teammitglied darf nicht erscheinen",
      role: "Nicht freigegeben",
      department: "Intern",
      description: "Dieser Datensatz darf nicht oeffentlich erscheinen.",
      image_url: null,
      sort_order: 99,
      review_status: "pending",
    },
  ];
}

function referenceRows(companies) {
  return [
    {
      company_id: requiredCompany(companies, "metallteq-83101-rohrdorf").id,
      title: "Phase3 Treppengelaender Rohrdorf",
      project_type: "Metallbau",
      location: "Rohrdorf",
      year: 2026,
      period: "Fruehjahr 2026",
      description: "Lokales Testprojekt mit freigegebenem Auftraggeber.",
      services: ["Treppengelaender", "Edelstahlhandlauf"],
      client_type: "Gewerbe",
      client_name: "Oeffentlicher Phase3-Testkunde",
      client_public: true,
      challenge: "Bestandsgebaeude mit engem Zeitfenster.",
      solution: "Vorfertigung in der Werkstatt und kurze Montage vor Ort.",
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "metallteq-83101-rohrdorf").id,
      title: "Phase3 Loftwand Privat",
      project_type: "Innenausbau",
      location: "Rosenheim",
      year: 2025,
      period: "Winter 2025",
      description: "Lokales Testprojekt mit privatem Auftraggeber.",
      services: ["Loftwand", "Stahl-Glas-System"],
      client_type: "Privat",
      client_name: "Privater Auftraggeber darf nicht erscheinen",
      client_public: false,
      challenge: "Hohe optische Anforderungen.",
      solution: "Schlanke Stahlprofile und vorab abgestimmte Glasfelder.",
      sort_order: 2,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "wagner-und-spielvogel-gbr-83083-riedering").id,
      title: "Phase3 Umbau Riedering",
      project_type: "Umbau",
      location: "Riedering",
      year: 2026,
      period: "2026",
      description: "Referenzprofil-Test mit eindeutig zugeordnetem Medium.",
      services: ["Umbau", "Sanierung"],
      client_type: "Gewerbe",
      client_name: "Oeffentliche Phase3-Baureferenz",
      client_public: true,
      challenge: "Umbau im laufenden Betrieb.",
      solution: "Abschnittsweise Bauausfuehrung mit klarer Abstimmung.",
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "wagner-und-spielvogel-gbr-83083-riedering").id,
      title: "Phase3 Aussenanlage Privat",
      project_type: "Aussenanlage",
      location: "Chiemgau",
      year: 2025,
      period: "Sommer 2025",
      description: "Referenzprofil-Test mit verborgenem Auftraggebernamen.",
      services: ["Aussenanlagen"],
      client_type: "Privat",
      client_name: "Privater Baureferenzkunde darf nicht erscheinen",
      client_public: false,
      challenge: "Mehrere Gewerke mussten koordiniert werden.",
      solution: "Klare Bauabschnitte und gemeinsame Abnahme.",
      sort_order: 2,
      review_status: "approved",
    },
  ];
}

function referenceMediaRows(companies, references, assets) {
  const referenceId = (companySlug, title) => {
    const company = requiredCompany(companies, companySlug);
    const reference = references.find((item) => item.company_id === company.id && item.title === title);
    if (!reference) fail(`Referenz fehlt fuer ${companySlug}: ${title}`);
    return reference.id;
  };

  return [
    {
      company_id: requiredCompany(companies, "metallteq-83101-rohrdorf").id,
      reference_id: referenceId("metallteq-83101-rohrdorf", "Phase3 Treppengelaender Rohrdorf"),
      file_url: assets["metallteq-83101-rohrdorf:referenceA"],
      media_type: "image",
      width: 1200,
      height: 800,
      category: "referenz",
      alt_text: "Lokales Phase-3-Referenzbild MetallteQ",
      caption: "Freigegebenes lokales Referenzbild",
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "metallteq-83101-rohrdorf").id,
      reference_id: referenceId("metallteq-83101-rohrdorf", "Phase3 Loftwand Privat"),
      file_url: assets["metallteq-83101-rohrdorf:referenceB"],
      media_type: "document",
      width: 1200,
      height: 800,
      category: "nicht-rendern",
      alt_text: "Dieses Dokument darf nicht als Bild gerendert werden",
      caption: "Nicht zu rendernder Medien-Typ",
      sort_order: 2,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "wagner-und-spielvogel-gbr-83083-riedering").id,
      reference_id: referenceId("wagner-und-spielvogel-gbr-83083-riedering", "Phase3 Umbau Riedering"),
      file_url: assets["wagner-und-spielvogel-gbr-83083-riedering:referenceA"],
      media_type: "image",
      width: 1200,
      height: 800,
      category: "referenz",
      alt_text: "Lokales Phase-3-Referenzbild Wagner und Spielvogel",
      caption: "Freigegebenes lokales Referenzbild",
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: requiredCompany(companies, "wagner-und-spielvogel-gbr-83083-riedering").id,
      reference_id: referenceId("wagner-und-spielvogel-gbr-83083-riedering", "Phase3 Aussenanlage Privat"),
      file_url: assets["wagner-und-spielvogel-gbr-83083-riedering:referenceB"],
      media_type: "image",
      width: 1200,
      height: 800,
      category: "referenz",
      alt_text: "Zweites lokales Phase-3-Referenzbild",
      caption: "Weiteres freigegebenes lokales Referenzbild",
      sort_order: 2,
      review_status: "approved",
    },
  ];
}

function certificateRows(companies) {
  const metallteq = requiredCompany(companies, "metallteq-83101-rohrdorf").id;
  return [
    {
      company_id: metallteq,
      title: "Phase3 Eigenangabe Metallbau",
      issuer: "MetallteQ",
      issued_at: "2026-07-01",
      valid_until: "2027-07-01",
      description: "Lokaler Testnachweis fuer self_declared.",
      file_url: "private/phase3/eigenangabe.pdf",
      proof_type: "Eigenangabe",
      verification_level: "self_declared",
      sort_order: 1,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      title: "Phase3 Nachweis hinterlegt",
      issuer: "Phase3 Teststelle",
      issued_at: "2026-07-02",
      valid_until: "2027-07-02",
      description: "Lokaler Testnachweis fuer document_uploaded.",
      file_url: "private/phase3/document-uploaded.pdf",
      proof_type: "Dokument",
      verification_level: "document_uploaded",
      sort_order: 2,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      title: "Phase3 Gepruefter Nachweis",
      issuer: "GewerkeListe Lokaltest",
      issued_at: "2026-07-03",
      valid_until: "2027-07-03",
      description: "Lokaler Testnachweis fuer gewerkeliste_checked.",
      file_url: "private/phase3/geprueft.pdf",
      proof_type: "Pruefung",
      verification_level: "gewerkeliste_checked",
      sort_order: 3,
      review_status: "approved",
    },
    {
      company_id: metallteq,
      title: "Interner Nachweis darf nicht erscheinen",
      issuer: "Intern",
      issued_at: "2026-07-04",
      valid_until: "2027-07-04",
      description: "Dieser Nachweis darf nicht oeffentlich erscheinen.",
      file_url: "private/phase3/internal.pdf",
      proof_type: "Intern",
      verification_level: "document_uploaded",
      sort_order: 99,
      review_status: "internal",
    },
  ];
}

function socialLinkRows(companies) {
  const metallteq = requiredCompany(companies, "metallteq-83101-rohrdorf").id;
  return [
    {
      company_id: metallteq,
      platform: "linkedin",
      url: "https://www.linkedin.com/company/metallteq",
      label: "LinkedIn",
      review_status: "approved",
      sort_order: 1,
    },
    {
      company_id: metallteq,
      platform: "instagram",
      url: "https://www.instagram.com/metallteq",
      label: "Instagram",
      review_status: "approved",
      sort_order: 2,
    },
    {
      company_id: metallteq,
      platform: "pending",
      url: "https://example.invalid/pending-social-darf-nicht-erscheinen",
      label: "Pending Social darf nicht erscheinen",
      review_status: "pending",
      sort_order: 99,
    },
    {
      company_id: metallteq,
      platform: "unsafe",
      url: "javascript:alert(1)",
      label: "Unsicherer Link darf nicht erscheinen",
      review_status: "approved",
      sort_order: 100,
    },
    {
      company_id: metallteq,
      platform: "unsafe-data",
      url: "data:text/html,boom",
      label: "Data-Link darf nicht erscheinen",
      review_status: "approved",
      sort_order: 101,
    },
  ];
}

function profileSectionRows(companies) {
  const metallteq = requiredCompany(companies, "metallteq-83101-rohrdorf").id;
  return [
    {
      company_id: metallteq,
      title: "Lokale Phase-3-Testdaten",
      body: "Dieser Abschnitt belegt freie Profilabschnitte im verifizierten lokalen Testprofil.",
      section_type: "local-test",
      review_status: "approved",
      sort_order: 1,
    },
    {
      company_id: metallteq,
      title: "Arbeitsweise im Testprofil",
      body: "Planung, Fertigung und Montage werden fuer die visuelle Phase-3-Pruefung dargestellt.",
      section_type: "working-method",
      review_status: "approved",
      sort_order: 2,
    },
    {
      company_id: metallteq,
      title: "Pending Abschnitt darf nicht erscheinen",
      body: "Dieser Abschnitt darf nicht oeffentlich erscheinen.",
      section_type: "pending",
      review_status: "pending",
      sort_order: 99,
    },
  ];
}

async function upsertRows(table, rows, onConflict, selectColumns = "*") {
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select(selectColumns);
  if (error) fail(`${table} upsert fehlgeschlagen: ${error.message}`);
  return data || [];
}

async function insertRows(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from(table).insert(rows).select("*");
  if (error) fail(`${table} insert fehlgeschlagen: ${error.message}`);
  return data || [];
}

async function selectRows(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) fail(`${table} select fehlgeschlagen: ${error.message}`);
  return data || [];
}

function requiredTrade(trades, slug) {
  const id = trades.get(slug);
  if (!id) fail(`Trade fehlt: ${slug}`);
  return id;
}

function requiredCompany(companies, slug) {
  const company = companies.get(slug);
  if (!company) fail(`Company fehlt: ${slug}`);
  return company;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
