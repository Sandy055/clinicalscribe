import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the tool that runs our React app during development
// and bundles it for production. This config just turns on React support.
export default defineConfig({
  plugins: [react()],
});
