/**
 * Returns a small validation-style JSON error payload with a configurable status code.
 */
export function sendValidationError(response, message, status = 400) {
  return response.status(status).json({ message });
}

/**
 * Returns a standardized 404 response for missing Todo entities.
 */
export function notFound(response, entity = "Resource") {
  return response.status(404).json({ message: `${entity} not found` });
}
