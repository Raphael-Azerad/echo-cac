import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4174",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 4174 --directory outputs/echo",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "Mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: "Desktop",
      use: {
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
