import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // In development the client calls relative /api paths and Vite forwards them to the Express server
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    // Keeps the CRA output folder name so the existing Netlify publish directory still works
    outDir: "build",
  },
});
