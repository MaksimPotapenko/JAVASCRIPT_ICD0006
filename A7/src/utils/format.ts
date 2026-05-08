import { checkpointTypeLabels, markingTypeLabels } from "@/types/nutikas";

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

export function checkpointTypeLabel(value: number): string {
  return checkpointTypeLabels[value] ?? `Type ${value}`;
}

export function markingTypeLabel(value: number): string {
  return markingTypeLabels[value] ?? `Type ${value}`;
}

export function formatCoordinate(value: string | null | undefined): string {
  return value?.trim() ? value : "n/a";
}
