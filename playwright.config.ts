import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against an ISOLATED stack on dedicated ports (backend 3100, frontend 5273),
 * so it never touches a demo server you may have running on 3000/5173. Each run boots a
 * fresh process → a fresh in-memory store. The frontend Vite proxy is pointed at the test
 * backend via VITE_API_TARGET (see frontend/vite.config.ts).
 *
 * Run: `npm run test:e2e`  (first time: `npx playwright install chromium`)
 */
const BACKEND_PORT = 3100;
const FRONTEND_PORT = 5273;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `PORT=${BACKEND_PORT} npm run start:dev --workspace=backend`,
      url: `http://localhost:${BACKEND_PORT}/api/events`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `VITE_API_TARGET=http://localhost:${BACKEND_PORT} npm run dev --workspace=frontend -- --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
