import coreWebVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...coreWebVitals,
  globalIgnores([
    ".next/**",
    ".next-dev/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/app/**",
  ]),
]);
