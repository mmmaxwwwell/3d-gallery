import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets preflight run against an isolated dev server (own
// worktree, own port) without colliding with the developer's
// long-running `npm run dev` on 5173.
const PORT = Number(process.env.E2E_PORT ?? 5173);
const BASE_URL = `http://localhost:${PORT}/3d-gallery/`;

// WASM renders are 10–60 s each. Keep parallelism low, timeouts generous.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60_000,
  },
});
