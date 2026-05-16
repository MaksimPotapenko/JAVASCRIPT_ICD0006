import { checkpointTypeLabels, markingTypeLabels } from "@/types/nutikas";

/** Formats a backend ISO string into a readable date-time label for cards and tables. */
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

/** Formats an ISO date into the compact value expected by datetime-local inputs. */
export function formatDateInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

/** Converts a numeric checkpoint type into a readable label. */
export function checkpointTypeLabel(value: number): string {
  return checkpointTypeLabels[value] ?? `Type ${value}`;
}

/** Converts a numeric marking type into a readable label. */
export function markingTypeLabel(value: number): string {
  return markingTypeLabels[value] ?? `Type ${value}`;
}

/** Displays a coordinate when present, otherwise a clear "not available" placeholder. */
export function formatCoordinate(value: string | null | undefined): string {
  return value?.trim() ? value : "n/a";
}
