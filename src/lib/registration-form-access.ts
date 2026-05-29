import { REGISTRATION_FORM_PRINTABLE_STATUSES } from "@/lib/constants";

export function normalizeRegistrationFormNumber(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.padStart(3, "0");
}

export function isRegistrationFormPrintable(status: string, registrationFormNumber: string | null | undefined) {
  return (
    REGISTRATION_FORM_PRINTABLE_STATUSES.includes(status as (typeof REGISTRATION_FORM_PRINTABLE_STATUSES)[number]) &&
    Boolean(String(registrationFormNumber ?? "").trim())
  );
}
