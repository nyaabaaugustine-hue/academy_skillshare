import { createNeonAuth } from "@neon/auth/next/server";

let _auth: ReturnType<typeof createNeonAuth> | null = null;

export function getAuth() {
  if (_auth) return _auth;
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  if (!baseUrl || !cookieSecret) {
    throw new Error(
      "Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.",
    );
  }
  _auth = createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret },
  });
  return _auth;
}

// Lazy proxy so existing `auth.*` imports don't throw during build when Neon env
// vars are absent; the real error is raised on first actual use.
export const auth = new Proxy({} as ReturnType<typeof createNeonAuth>, {
  get(_target, prop) {
    return (getAuth() as any)[prop];
  },
});
