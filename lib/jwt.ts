const CLAIM_NAME_IDENTIFIER =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const CLAIM_EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const CLAIM_NAME = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const json = atob(padded);
  return JSON.parse(json);
}

export function getCurrentUserFromToken(token: string): CurrentUser {
  const claims = decodeJwtPayload(token);
  return {
    id: String(claims[CLAIM_NAME_IDENTIFIER]),
    email: String(claims[CLAIM_EMAIL]),
    name: String(claims[CLAIM_NAME]),
  };
}
