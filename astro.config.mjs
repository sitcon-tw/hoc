// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://sitcon.org",
  base: "/2025-hoc/",
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});