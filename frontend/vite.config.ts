import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    react(),
    basicSsl({ name: "bis-assist-local" }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["Bureau_of_Indian_Standards_Logo.svg"],
      manifest: {
        name: "BIS Assist - Indian Standards Assistant",
        short_name: "BIS Assist",
        description: "Accessible BIS standards, product safety and certification guidance.",
        theme_color: "#0B3A82",
        background_color: "#F5F9FF",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "en-IN",
        icons: [
          {
            src: "/Bureau_of_Indian_Standards_Logo.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
});