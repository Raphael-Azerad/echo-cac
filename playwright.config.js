import { defineConfig } from "@playwright/test";

const previewPort = process.env.ECHO_TEST_PORT || "4175";
const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: previewUrl,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `python3 -m http.server ${previewPort} --directory outputs/echo`,
    url: previewUrl,
    reuseExistingServer: false,
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
