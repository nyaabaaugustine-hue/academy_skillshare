import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Admin auth is deliberately small: one operator email and password from the
 * environment, and a signed, expiring HttpOnly cookie. There are no user
 * accounts to manage, and nothing sensitive lives behind the login except the
 * organisation's own content.
 */
export const ADMIN_COOKIE = "sb_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error("ADMIN_SESSION_SECRET is not set. See .env.example and .env.local.");
  }
  return value;
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Hash both sides first so comparisons never leak a length difference. */
function digest(value) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a, b) {
  return timingSafeEqual(digest(a), digest(b));
}

export function normaliseAdminEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Check the operator credentials from the environment. Both the email and the
 * password are compared in constant time, and a missing environment value
 * always fails closed rather than accepting an empty string.
 */
export function credentialsMatch(email, password) {
  const expectedEmail = normaliseAdminEmail(process.env.ADMIN_EMAIL);
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (expectedEmail === "" || expectedPassword === "") return false;
  if (typeof email !== "string" || typeof password !== "string") return false;

  const emailOk = safeEqual(normaliseAdminEmail(email), expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

export function createSessionToken(now = Date.now(), email = "") {
  const payload = Buffer.from(
    JSON.stringify({
      sub: normaliseAdminEmail(email),
      exp: now + ADMIN_SESSION_MAX_AGE * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSession(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = sign(payload);
  const given = Buffer.from(mac);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof exp !== "number" || exp <= Date.now()) return null;
    return { email: typeof sub === "string" ? sub : "", expiresAt: exp };
  } catch {
    return null;
  }
}

export function verifySessionToken(token) {
  return readSession(token) !== null;
}

export async function getAdminSession() {
  const jar = await cookies();
  return readSession(jar.get(ADMIN_COOKIE)?.value);
}

export async function isAdmin() {
  return (await getAdminSession()) !== null;
}

/** Server components and page handlers: bounce signed-out visitors to login. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Route handlers: return a 401 the fetch caller can act on. */
export async function assertAdmin() {
  if (await isAdmin()) return null;
  return new Response("Unauthorized", { status: 401 });
}
