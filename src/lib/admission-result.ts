import {
  ADMISSION_PUBLICATION_LABELS,
  ADMISSION_RESULT_LABELS,
  ADMISSION_RESULT_STATUSES,
} from "@/lib/constants";

export type AdmissionResultStatus = (typeof ADMISSION_RESULT_STATUSES)[number];

export function isAdmissionResultStatus(value: string): value is AdmissionResultStatus {
  return ADMISSION_RESULT_STATUSES.includes(value as AdmissionResultStatus);
}

export function admissionPublicationStatus(published: boolean, publishedAt?: Date | string | null) {
  if (published) return ADMISSION_PUBLICATION_LABELS.DA_CONG_BO;
  if (publishedAt) return ADMISSION_PUBLICATION_LABELS.DA_GO_CONG_BO;
  return ADMISSION_PUBLICATION_LABELS.CHUA_CONG_BO;
}

export function admissionResultLabel(value: string) {
  return ADMISSION_RESULT_LABELS[value] ?? value;
}

export function canPublishAdmissionResult(value: string) {
  return value === "TRUNG_TUYEN";
}
