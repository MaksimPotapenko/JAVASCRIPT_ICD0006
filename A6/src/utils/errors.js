export function sendValidationError(response, message, status = 400) {
  return response.status(status).json({ message });
}

export function notFound(response, entity = "Resource") {
  return response.status(404).json({ message: `${entity} not found` });
}
