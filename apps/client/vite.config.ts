import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// __dirname fix voor ESM/TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",        // Vercel verwacht dit
    emptyOutDir: true,     // leegt dist bij elke build
  },
  server: {
    port: 5173,            // lokaal dev port (optioneel)
    open: true,            // opent browser bij dev start
  },
});
