import type { PublicCompanyWithTrade } from "@/lib/types/public-directory";

export type PublicProfileHeaderContact = {
  id: string | null;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
};

type PremiumContacts = NonNullable<PublicCompanyWithTrade["premium_profile"]>["contacts"];

export function getPrimaryProfileContacts(
  company: PublicCompanyWithTrade,
  premiumContacts: PremiumContacts,
  limit = 2,
): PublicProfileHeaderContact[] {
  const contacts: PublicProfileHeaderContact[] = [];
  const sortedPremiumContacts = [...premiumContacts].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  for (const contact of sortedPremiumContacts) {
    const normalized = normalizePremiumContact(company.name, contact);
    if (!normalized || contacts.some((existing) => contactsMatch(existing, normalized))) continue;
    contacts.push(normalized);
    if (contacts.length >= limit) return contacts;
  }

  const legacy = normalizeLegacyContact(company);
  if (legacy && !contacts.some((existing) => contactsMatch(existing, legacy))) contacts.push(legacy);

  return contacts.slice(0, limit);
}

export function getAdditionalProfileContacts(
  premiumContacts: PremiumContacts,
  primaryContacts: PublicProfileHeaderContact[],
): PremiumContacts {
  return premiumContacts.filter((contact) => {
    const normalized = normalizePremiumContact("", contact);
    if (!normalized) return false;
    return !primaryContacts.some((primary) => contactsMatch(primary, normalized));
  });
}

export function contactsMatch(
  first: Pick<PublicProfileHeaderContact, "id" | "name" | "email" | "phone">,
  second: Pick<PublicProfileHeaderContact, "id" | "name" | "email" | "phone">,
) {
  const firstId = clean(first.id);
  const secondId = clean(second.id);
  if (firstId && secondId && firstId === secondId) return true;

  const firstName = normalizeName(first.name);
  const secondName = normalizeName(second.name);
  if (firstName && secondName) return firstName === secondName;

  const firstEmail = normalizeEmail(first.email);
  const secondEmail = normalizeEmail(second.email);
  if (firstEmail && secondEmail && firstEmail === secondEmail) return true;

  const firstPhone = normalizePhone(first.phone);
  const secondPhone = normalizePhone(second.phone);
  if (firstPhone && secondPhone && firstPhone === secondPhone) return true;

  return false;
}

function normalizePremiumContact(companyName: string, contact: PremiumContacts[number]): PublicProfileHeaderContact | null {
  const name = clean(contact.name);
  if (!name) return null;
  return {
    id: clean(contact.id) || null,
    name,
    role: clean(contact.role) || null,
    phone: clean(contact.phone) || null,
    email: clean(contact.email) || null,
    imageUrl: clean(contact.image_url) || null,
    imageAlt: `${name} Ansprechpartner bei ${companyName || "dem Betrieb"}`,
  };
}

function normalizeLegacyContact(company: PublicCompanyWithTrade): PublicProfileHeaderContact | null {
  const name = clean(company.contact_person_name || company.contact_name);
  if (!name) return null;
  return {
    id: null,
    name,
    role: clean(company.contact_person_role) || null,
    phone: clean(company.contact_person_phone || company.phone) || null,
    email: clean(company.contact_person_email || company.email) || null,
    imageUrl: clean(company.profile_image_url) || null,
    imageAlt: clean(company.profile_image_alt) || `${name} Ansprechpartner bei ${company.name}`,
  };
}

function normalizeName(value?: string | null) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeEmail(value?: string | null) {
  return clean(value).toLowerCase();
}

function normalizePhone(value?: string | null) {
  return clean(value).replace(/[^\d+]/g, "");
}

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}
