export type ImpressumExtraction = {
  companyName?: string;
  legalForm?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  email?: string;
  phone?: string;
};

export function hasImpressumSignal(url: string, text: string) {
  return /impressum|anbieterkennzeichnung/i.test(`${url} ${text}`);
}
