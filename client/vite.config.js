import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const PROXY = {
  "/api": {
    target: "http://localhost:5001",
    changeOrigin: true,
  },
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // Student app → port 5173  |  Admin app → port 5174 (npm run admin)
    port: mode === "admin" ? 5174 : 5173,
    proxy: PROXY,
  },
}));
