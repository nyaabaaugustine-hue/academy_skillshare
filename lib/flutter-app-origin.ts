/**
 * Returns the exact Flutter app origin allowed to call the website APIs.
 *
 * Prefer the dedicated CORS setting. The public app URL is a safe fallback
 * for local setups where both values describe the same hosted Flutter build.
 */
export function getFlutterAppOrigin(): string {
  const configured =
    process.env.FLUTTER_APP_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_LEARN_URL?.trim();
  if (!configured) return "";

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.origin;
  } catch {
    return "";
  }
}
