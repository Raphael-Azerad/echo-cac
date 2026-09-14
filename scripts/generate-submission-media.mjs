import { chromium } from "@playwright/test";
import { mkdir, rename, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "outputs", "echo");
const mediaDir = path.join(root, "docs", "assets", "submission");
const tempVideoDir = path.join(root, ".tmp-submission-video");
const baseUrl = "http://127.0.0.1:4174";
const viewport = { width: 600, height: 800 };
let navigationCounter = 0;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  const server = spawn("python3", ["-m", "http.server", "4174", "--directory", appDir], {
    stdio: "ignore",
  });

  return {
    async stop() {
      if (server.killed) return;
      server.kill();
      await wait(250);
    },
  };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Keep trying while the local static server starts.
    }
    await wait(250);
  }
  throw new Error("Timed out waiting for Echo preview server.");
}

async function resetEcho(page) {
  await page.goto(`${baseUrl}/?video=home#home`);
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase("echo-local");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
    localStorage.setItem("echo:onboarding-complete", "true");
    localStorage.setItem("echo:theme", "light");
  });
  await page.goto(`${baseUrl}/?reset=${Date.now()}#home`);
}

async function seedEchoes(page) {
  await page.evaluate(async () => {
    const now = new Date("2026-09-14T15:00:00.000Z");
    const tomorrow = new Date("2026-09-15T15:00:00.000Z");
    const future = new Date("2027-09-14T15:00:00.000Z");
    const openedKey = "echo:opened-returned";

    const echoes = [
      {
        id: "submission-returned-demo",
        title: "Before the first prototype",
        letter:
          "I am writing this before the project feels finished. The room is quiet, the deadline is loud, and I can feel the idea becoming real.",
        futureSelf: "Me after submission",
        futureHope: "I hope you remember that this started as a small room, a real feeling, and a promise to preserve it.",
        goals: "Build with more taste, patience, and courage than the deadline asks for.",
        mood: "Hopeful",
        weather: "Warm evening",
        location: "Dallas, Texas",
        createdAt: "2026-09-12T20:30:00.000Z",
        unlockAt: "2026-09-13T20:30:00.000Z",
        demo: true,
        demoRole: "returned",
        attachments: [
          {
            id: "artifact-photo",
            name: "Desk light before launch.png",
            type: "image/png",
            kind: "image",
            size: 42000,
            dataUrl:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'%3E%3Crect width='600' height='360' fill='%23f4eadb'/%3E%3Crect x='90' y='210' width='420' height='46' rx='8' fill='%236b5643'/%3E%3Crect x='230' y='84' width='140' height='100' rx='10' fill='%232f2924'/%3E%3Crect x='250' y='104' width='100' height='58' fill='%23d5b46b'/%3E%3Ccircle cx='160' cy='130' r='28' fill='%2387937b'/%3E%3Ccircle cx='440' cy='134' r='28' fill='%23ba9a83'/%3E%3Ctext x='300' y='307' text-anchor='middle' font-family='Georgia' font-size='24' fill='%23463831'%3EDesk light before launch%3C/text%3E%3C/svg%3E",
          },
          {
            id: "artifact-audio",
            name: "Voice note before launch.webm",
            type: "audio/webm",
            kind: "audio",
            size: 18000,
            dataUrl: "data:audio/webm;base64,AAAA",
          },
          {
            id: "artifact-video",
            name: "Thirty seconds before the demo.mp4",
            type: "video/mp4",
            kind: "video",
            size: 24000,
            dataUrl: "data:video/mp4;base64,AAAA",
            demoStatic: true,
            posterDataUrl:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'%3E%3Crect width='600' height='360' fill='%232f2924'/%3E%3Crect x='76' y='70' width='448' height='220' rx='24' fill='%23f1e4d0'/%3E%3Crect x='125' y='225' width='350' height='30' rx='8' fill='%2364513f'/%3E%3Crect x='246' y='108' width='108' height='78' rx='10' fill='%23413732'/%3E%3Crect x='265' y='126' width='70' height='38' fill='%23d5b46b'/%3E%3Ccircle cx='178' cy='144' r='25' fill='%2387937b'/%3E%3Ccircle cx='422' cy='144' r='25' fill='%23ba9a83'/%3E%3Ctext x='300' y='320' text-anchor='middle' font-family='Georgia' font-size='24' fill='%23f4eadb'%3EThirty seconds before the demo%3C/text%3E%3C/svg%3E",
          },
        ],
        context: {
          capturedAt: "2026-09-12T20:30:00.000Z",
          source: "submission-media",
          date: "2026-09-12",
          coordinates: { latitude: 32.7767, longitude: -96.797 },
          place: { label: "Dallas, Texas, United States" },
          weather: { summary: "Warm evening, light wind" },
          daylight: { summary: "After sunset" },
        },
      },
      {
        id: "submission-soon-sealed",
        title: "The week after launch",
        letter: "This sealed letter is intentionally hidden until it returns.",
        futureSelf: "Me after launch week",
        futureHope: "I hope the pressure has turned into pride.",
        goals: "Stay close to what felt human about the project.",
        mood: "Uncertain",
        weather: "Unknown",
        location: "Home",
        createdAt: now.toISOString(),
        unlockAt: tomorrow.toISOString(),
        demo: true,
        demoRole: "future",
        attachments: [],
      },
      {
        id: "submission-future-sealed",
        title: "One year from now",
        letter: "This sealed letter is intentionally hidden until it returns.",
        futureSelf: "Me one year older",
        futureHope: "I hope this still feels like a real record of becoming.",
        goals: "Keep building things that preserve people instead of flattening them.",
        mood: "Grateful",
        weather: "Unknown",
        location: "Home",
        createdAt: now.toISOString(),
        unlockAt: future.toISOString(),
        demo: true,
        demoRole: "future",
        attachments: [],
      },
    ];

    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("echo-local", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("echoes")) {
          const store = db.createObjectStore("echoes", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("unlockAt", "unlockAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise((resolve, reject) => {
      const transaction = database.transaction("echoes", "readwrite");
      const store = transaction.objectStore("echoes");
      echoes.forEach((echo) => store.put(echo));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    localStorage.setItem(openedKey, JSON.stringify(["submission-returned-demo"]));
  });
}

async function settle(page) {
  await page.locator(".app-view").first().waitFor({ state: "visible" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
      .toast { display: none !important; }
    `,
  });
  await page.waitForTimeout(350);
}

async function shot(page, name, hash, options = {}) {
  navigationCounter += 1;
  await page.goto(`${baseUrl}/?media=${navigationCounter}${hash}`);
  await settle(page);
  if (options.scrollTo !== undefined) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), options.scrollTo);
    await page.waitForTimeout(200);
  }
  if (options.action) await options.action(page);
  await page.screenshot({
    path: path.join(mediaDir, `${name}.jpg`),
    type: "jpeg",
    quality: 92,
    fullPage: false,
  });
}

async function makeScreenshots(page) {
  await shot(page, "01-home-returned-and-sealed", "#home");
  await shot(page, "02-write-room-media-first", "#create");
  await shot(page, "03-writing-prompts-tabs", "#create", {
    action: async (page) => {
      await page.getByRole("button", { name: "Prompts" }).click();
      await page.getByRole("tab", { name: "Future" }).click();
      await page.waitForTimeout(200);
    },
  });
  await shot(page, "04-active-writing-cue", "#create", {
    action: async (page) => {
      await page.getByRole("button", { name: "Prompts" }).click();
      await page.getByRole("tab", { name: "Human" }).click();
      await page.getByRole("button", { name: "Who matters most to you right now?" }).click();
      await page.waitForTimeout(200);
    },
  });
  await shot(page, "05-present-and-future-fields", "#create", { scrollTo: 620 });
  await shot(page, "06-archive-privacy", "#archive");
  await shot(page, "07-returned-echo-detail", "#echo/submission-returned-demo");
  await shot(page, "08-media-evidence-tray", "#echo/submission-returned-demo", { scrollTo: 760 });
  await shot(page, "09-trust-layer", "#trust");
  await shot(page, "10-settings-technical-proof", "#settings", {
    scrollTo: 760,
    action: async (page) => {
      await page.getByText("Technical proof").click();
      await page.waitForTimeout(200);
    },
  });
}

async function makeVideo() {
  await rm(tempVideoDir, { recursive: true, force: true });
  await mkdir(tempVideoDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();
  await resetEcho(page);
  await seedEchoes(page);
  await page.addStyleTag({ content: ".toast { display: none !important; }" });

  await page.goto(`${baseUrl}/#home`);
  await settle(page);
  await page.waitForTimeout(1800);

  await page.getByRole("button", { name: /Create New Echo/ }).click();
  await settle(page);
  await page.waitForTimeout(1000);

  await page.getByPlaceholder("A letter to later").fill("Before the submission");
  await page
    .getByPlaceholder("Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.")
    .fill("This is the room before the project leaves my hands. I want the future to remember the pressure, the care, and the reason Echo exists.");
  await page.waitForTimeout(1200);

  await page.getByRole("button", { name: "Prompts" }).click();
  await page.getByRole("tab", { name: "Future" }).click();
  await page.waitForTimeout(1200);

  await page.evaluate(() => window.scrollTo({ top: 620, behavior: "smooth" }));
  await page.waitForTimeout(1200);
  await page.getByLabel("Who are you writing to?").fill("Me after CAC");
  await page.getByLabel("When this opens, I hope...").fill("I hope the project still feels honest and useful.");
  await page.getByRole("button", { name: "Hopeful" }).click();
  await page.waitForTimeout(1000);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Seal until then" }).click();
  await settle(page);
  await page.waitForTimeout(1500);

  await page.goto(`${baseUrl}/?video=archive#archive`);
  await settle(page);
  await page.waitForTimeout(1600);

  await page.goto(`${baseUrl}/?video=returned#echo/submission-returned-demo`);
  await settle(page);
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo({ top: 760, behavior: "smooth" }));
  await page.waitForTimeout(1600);

  await page.goto(`${baseUrl}/?video=trust#trust`);
  await settle(page);
  await page.waitForTimeout(1500);

  const video = page.video();
  await context.close();
  await browser.close();
  const videoPath = await video.path();
  await rename(videoPath, path.join(mediaDir, "echo-demo-walkthrough.webm"));
  await rm(tempVideoDir, { recursive: true, force: true });
}

async function main() {
  await mkdir(mediaDir, { recursive: true });
  const server = startServer();
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await resetEcho(page);
    await seedEchoes(page);
    await makeScreenshots(page);
    await browser.close();
    await makeVideo();
  } finally {
    await server.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
