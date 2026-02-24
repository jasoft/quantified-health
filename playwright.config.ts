import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const useManagedWebServer = process.env.PLAYWRIGHT_USE_WEBSERVER === "1";
const resolvedPort = (() => {
  try {
    return Number(new URL(baseURL).port || 3000);
  } catch {
    return 3000;
  }
})();

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useManagedWebServer
    ? {
        command: `npm run dev -- --port ${resolvedPort}`,
        port: resolvedPort,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
