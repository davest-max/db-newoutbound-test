import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "tailwind-preset": "src/tailwind-preset.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "tailwindcss"],
  loader: {
    ".svg": "dataurl",
  },
  // Copy the CSS tokens file to dist
  onSuccess: "mkdir -p dist/styles && cp src/styles/lyra-tokens.css dist/styles/lyra-tokens.css",
});
