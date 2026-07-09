export function isAuthSessionError(error: Error) {
  return /session|jwt|token|unauthorized/i.test(error.message);
}
