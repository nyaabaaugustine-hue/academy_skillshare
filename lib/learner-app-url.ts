/** True for a hostname that only exists on the machine it runs on. */
export function isLoopbackHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

/** Hostname of an absolute URL, or "" when the value is not a URL. */
export function hostOfUrl(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

/**
 * True when `value` is the local development bundle rather than a hosted one.
 *
 * `NEXT_PUBLIC_LEARN_URL` is inlined at build time and its dev default is
 * `http://localhost:8080`. If that value is ever shipped to production, callers
 * that navigate the browser (the post sign-in redirect, "Continue learning")
 * would bounce every visitor to their own machine, and `/learn` would frame a
 * blank page. Treat it as unusable in a production build.
 */
export function isLocalDevBundle(value: string): boolean {
  const url = value.trim();
  return url !== "" && isLoopbackHost(hostOfUrl(url));
}

function resolve(): string | undefined {
  const configured = (process.env.NEXT_PUBLIC_LEARN_URL ?? "").trim();
  if (configured === "") return undefined;
  if (process.env.NODE_ENV === "production" && isLocalDevBundle(configured)) {
    return undefined;
  }
  return configured;
}

/**
 * The web app is built with `flutter build web --base-href=/app/` and shipped
 * inside this site at public/app, so it is always reachable from this site - no
 * external host and no environment variable required.
 *
 * Serving it same-origin matters for more than convenience: the app calls
 * `/api/auth`, `/api/leaderboard` and `/api/tutor`, which are the same routes
 * the Android app uses and which talk to the same Neon Auth + Neon Postgres.
 * On the same origin the browser attaches its Neon Auth cookie automatically,
 * so a learner who signed in on the marketing site is already signed in inside
 * the app, against the same database.
 */
const SAME_ORIGIN_BUNDLE_PATH = "/app/index.html";

/**
 * Where `/learn` frames the Flutter web app: an explicitly hosted bundle when
 * NEXT_PUBLIC_LEARN_URL points at one, otherwise the bundle shipped with this
 * site. A loopback value never wins in a production build.
 */
export const learnerAppBundleUrl = resolve() ?? SAME_ORIGIN_BUNDLE_PATH;

/**
 * Where a signed-in learner "continues" to: this site's own learner page, which
 * frames `learnerAppBundleUrl`. Always reachable in production.
 */
export const learnerAppUrl = "/learn";

/**
 * Where the Log in / Register buttons send people: the Flutter web app itself,
 * which opens on its own sign-in and registration screens while signed out.
 *
 * Always the bundle shipped with this site, never NEXT_PUBLIC_LEARN_URL, so the
 * auth screens are same-origin with the Neon Auth session cookie the site and
 * the app share. `v=2` busts the cached copy of the earlier bundle.
 */
export const learnerAuthUrl = `${SAME_ORIGIN_BUNDLE_PATH}?v=2`;
