import {
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
} from "@/lib/constants";

export function physicalDossierStatusLabel(value: string) {
  return PHYSICAL_DOSSIER_LABELS[value] ?? value;
}

export function physicalDossierValidityLabel(value: string) {
  return PHYSICAL_DOSSIER_VALIDITY_LABELS[value] ?? value;
}

export function isPhysicalDossierComplete(status: string, validity: string) {
  return status === "DA_NOP_TRUC_TIEP" && validity === "HOP_LE";
}
