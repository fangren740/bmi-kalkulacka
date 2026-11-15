import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

export function hasQaCredential(env) {
  return Boolean(env?.QA_TOKEN || env?.QA_AUTO_TOKEN);
}

function matches(token, expected) {
  if (!expected) return false;
  const actualBytes = Buffer.from(token);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function qaCredential(header, env) {
  if (typeof header !== "string" || !header.startsWith("Bearer ") || header.length > 2048) return null;
  const token = header.slice(7);
  if (matches(token, env?.QA_AUTO_TOKEN)) return "automatic";
  if (matches(token, env?.QA_TOKEN)) return "manual";
  return null;
}
