import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development";

/**
 * Origin of the separately hosted Flutter web build that `/learn` embeds in an
 * iframe. FLUTTER_APP_ORIGIN wins; NEXT_PUBLIC_LEARN_URL is the fallback (same
 * rule as lib/flutter-app-origin.ts). If neither parses, the frame-src falls
 * back to 'self' only - the /learn page then shows its "not linked" notice
 * instead of a cross-origin frame, so nothing breaks.
 */
const flutterAppOrigin = (() => {
  const configured =
    process.env.FLUTTER_APP_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_LEARN_URL?.trim();
  if (!configured) return "";
  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : "";
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy, tuned to what this site actually loads:
 *  - script-src: Next.js injects inline bootstrap/hydration scripts, so
 *    'unsafe-inline' is required (a nonce would need middleware). 'unsafe-eval'
 *    is added in development only (React/Turbopack HMR). 'wasm-unsafe-eval' +
 *    cdn.jsdelivr.net let the Pyodide Web Worker (public/py-worker.js) run.
 *    www.gstatic.com serves the Flutter engine's CanvasKit for the web app
 *    shipped at /app.
 *  - style-src: Next injects styles inline and components set inline style
 *    attributes (Reveal delay, password meter), so 'unsafe-inline' is required.
 *    fonts.googleapis.com serves the @import'd DM Sans / Manrope families.
 *  - img-src / media-src: Cloudinary hosts lesson art, the hero <video> and a
 *    CSS background; images.unsplash.com is the marketing imagery; data: and
 *    blob: cover generated/optimised images.
 *  - font-src: next/font self-hosts woff2 under /_next/static, so 'self' is
 *    enough for those; fonts.gstatic.com serves the @import'd webfont files.
 *  - connect-src: the browser only calls same-origin /api/* (auth is proxied
 *    through /api/auth); ws:/wss: are for the development HMR socket. The web
 *    app pulls Pyodide (cdn.jsdelivr.net), CanvasKit (www.gstatic.com), Flutter
 *    fallback fonts (fonts.gstatic.com) via fetch(), and the FCM worker needs
 *    the Firebase Installations and FCM subscription endpoints.
 *  - frame-src: /learn embeds the Flutter web app - the copy shipped at /app
 *    ('self') and/or a separately hosted bundle at flutterAppOrigin. The
 *    contact page embeds a Google Maps iframe.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "media-src 'self' blob: data: https://res.cloudinary.com",
  isDev
    ? "connect-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com https://fonts.gstatic.com https://firebaseinstallations.googleapis.com https://fcm.googleapis.com ws: wss:"
    : "connect-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com https://fonts.gstatic.com https://firebaseinstallations.googleapis.com https://fcm.googleapis.com",
  `frame-src 'self'${flutterAppOrigin ? ` ${flutterAppOrigin}` : ""} https://www.google.com`,
  "worker-src 'self' blob: https://www.gstatic.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: root,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
  async rewrites() {
    // The Flutter web app is a static bundle under public/app. Browsers ask for
    // the directory (/app or /app/), but Next serves the file itself, so route
    // those to the entry document. Relative asset URLs resolve via the bundle's
    // own <base href="/app/">, so the document URL does not matter.
    return [
      { source: "/app", destination: "/app/index.html" },
      { source: "/app/", destination: "/app/index.html" },
    ];
  },
  // The marketing imagery is plain <img> markup, so nothing goes through the
  // Next image optimiser and no remotePatterns allow-list is needed.
  images: { unoptimized: true },
};

export default nextConfig;
