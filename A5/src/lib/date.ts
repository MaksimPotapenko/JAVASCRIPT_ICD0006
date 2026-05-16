/**
 * Produces the current timestamp in ISO format for backend payloads.
 */
export function nowIso() {
  // The backend stores timestamps in ISO format, so we create them that way at the source.
  return new Date().toISOString();
}

/**
 * Converts an ISO timestamp from the backend into the local input format used by `datetime-local`.
 */
export function toDateTimeLocal(value?: string | null) {
  // Empty backend values should leave the input blank instead of producing "Invalid Date".
  if (!value) return "";

  const date = new Date(value);
  // Invalid timestamps are treated as empty so forms stay editable.
  if (Number.isNaN(date.getTime())) return "";

  // Adjust the timestamp by the local timezone offset so the input shows local wall-clock time.
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}
