// OWNER: 02-content-data.md — do not edit from another role
// Stub authored in Wave 0 (role 01) only to keep the tree compiling. Role 02 fills this with the
// real contact methods sourced from the resume header from Wave 1 onward. `ContactMethod` isn't
// part of the frozen site/lib/types.ts contract (§12 doesn't define one) — role 02 owns this
// local shape per workflow/02-content-data.md Contract out.

export interface ContactMethod {
  label: string;
  value: string;
  href?: string;
}

export const contact: ContactMethod[] = [
  {
    label: "Email",
    value: "azucenavadrian@gmail.com",
    href: "mailto:azucenavadrian@gmail.com",
  },
  {
    label: "Location",
    value: "Imus, Cavite, Philippines",
  },
  // NOTE: Phone number omitted — this is a public portfolio and phone is PII typically not exposed
  // on open portfolios unless explicitly intended for client/recruiter direct contact.
];
