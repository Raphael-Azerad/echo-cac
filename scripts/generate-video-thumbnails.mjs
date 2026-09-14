import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "assets", "video");
const assetCache = new Map();

async function asset(file) {
  if (assetCache.has(file)) return assetCache.get(file);
  const absolute = path.join(root, file);
  const buffer = await readFile(absolute);
  const extension = path.extname(file).toLowerCase();
  const mime =
    extension === ".svg"
      ? "image/svg+xml"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".png"
          ? "image/png"
          : "application/octet-stream";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  assetCache.set(file, dataUrl);
  return dataUrl;
}

const thumbnails = [
  {
    file: "echo-thumbnail-01-preserve-time.jpg",
    theme: "artifact",
    eyebrow: "ECHO",
    title: "Preserve who you were",
    subtitle: "Letters, voice, video, and context returned when they matter.",
    primary: "docs/assets/submission/07-returned-echo-detail.jpg",
    secondary: "docs/assets/submission/08-media-evidence-tray.jpg",
  },
  {
    file: "echo-thumbnail-02-human-place-time.jpg",
    theme: "proof",
    eyebrow: "CONGRESSIONAL APP CHALLENGE",
    title: "A human. A place. A time.",
    subtitle: "A private archive artifact, not another notes app.",
    primary: "docs/assets/submission/08-media-evidence-tray.jpg",
    secondary: "docs/assets/submission/05-present-and-future-fields.jpg",
  },
  {
    file: "echo-thumbnail-03-notes-fail.jpg",
    theme: "contrast",
    eyebrow: "WHY ECHO EXISTS",
    title: "Notes save words. Echo saves the moment.",
    subtitle: "Local-first, private, and sealed until the future.",
    primary: "docs/assets/submission/02-write-room-media-first.jpg",
    secondary: "docs/assets/submission/01-home-returned-and-sealed.jpg",
  },
];

async function htmlFor(thumbnail) {
  const logo = await asset("outputs/echo/icon.svg");
  const primary = await asset(thumbnail.primary);
  const secondary = await asset(thumbnail.secondary);

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            width: 1280px;
            height: 720px;
            margin: 0;
            overflow: hidden;
            background: #f4eadb;
            color: #2c251f;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .canvas {
            position: relative;
            width: 1280px;
            height: 720px;
            overflow: hidden;
            background: #f4eadb;
          }

          .canvas::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(255, 250, 242, 0.96) 0%, rgba(255, 250, 242, 0.88) 48%, rgba(234, 220, 201, 0.92) 100%);
            z-index: 0;
          }

          .canvas::after {
            content: "";
            position: absolute;
            inset: 32px;
            border: 1px solid rgba(108, 82, 58, 0.18);
            border-radius: 28px;
            pointer-events: none;
            z-index: 4;
          }

          .brand {
            position: absolute;
            top: 58px;
            left: 70px;
            display: flex;
            align-items: center;
            gap: 14px;
            z-index: 5;
            color: #5d432f;
            font-size: 20px;
            font-weight: 850;
            letter-spacing: 0.11em;
          }

          .brand img {
            width: 54px;
            height: 54px;
            border-radius: 15px;
          }

          .copy {
            position: absolute;
            left: 70px;
            top: 158px;
            width: 570px;
            z-index: 5;
          }

          .eyebrow {
            margin: 0 0 20px;
            color: #765c45;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          h1 {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 70px;
            line-height: 0.96;
            font-weight: 500;
            letter-spacing: 0;
          }

          .subtitle {
            max-width: 520px;
            margin: 24px 0 0;
            color: #5e5145;
            font-size: 27px;
            line-height: 1.22;
            font-weight: 700;
          }

          .proof {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 28px;
          }

          .proof span {
            border: 1px solid #c7b493;
            border-radius: 999px;
            padding: 10px 15px;
            background: rgba(255, 250, 242, 0.82);
            color: #4b3829;
            font-size: 17px;
            font-weight: 800;
          }

          .panel {
            position: absolute;
            z-index: 2;
            overflow: hidden;
            background: #fff8ee;
            border: 1px solid rgba(93, 67, 47, 0.24);
            box-shadow: 0 28px 70px rgba(62, 43, 25, 0.20);
          }

          .panel img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          .seal {
            position: absolute;
            right: 58px;
            bottom: 48px;
            width: 132px;
            height: 132px;
            z-index: 5;
            border-radius: 999px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(166, 134, 93, 0.42);
            background: rgba(255, 250, 242, 0.82);
            box-shadow: 0 20px 48px rgba(62, 43, 25, 0.14);
          }

          .seal img {
            width: 78px;
            height: 78px;
          }

          .artifact .main-panel {
            right: 76px;
            top: 76px;
            width: 420px;
            height: 560px;
            border-radius: 28px;
          }

          .artifact .side-panel {
            right: 410px;
            bottom: 58px;
            width: 248px;
            height: 330px;
            border-radius: 22px;
            opacity: 0.96;
          }

          .proof-theme .copy {
            width: 570px;
          }

          .proof-theme .main-panel {
            right: 70px;
            top: 78px;
            width: 484px;
            height: 360px;
            border-radius: 26px;
          }

          .proof-theme .main-panel img {
            object-position: top center;
          }

          .proof-theme .side-panel {
            right: 166px;
            bottom: 56px;
            width: 330px;
            height: 228px;
            border-radius: 22px;
          }

          .proof-theme h1 {
            font-size: 74px;
          }

          .contrast {
            background: #2c251f;
            color: #fff8ee;
          }

          .contrast::before {
            background:
              linear-gradient(90deg, rgba(44, 37, 31, 0.96) 0%, rgba(70, 53, 39, 0.92) 48%, rgba(244, 234, 219, 0.96) 100%);
          }

          .contrast::after {
            border-color: rgba(255, 248, 238, 0.16);
          }

          .contrast .brand,
          .contrast .eyebrow {
            color: #e7d5bc;
          }

          .contrast .subtitle {
            color: #ddccb7;
          }

          .contrast .proof span {
            background: rgba(255, 248, 238, 0.10);
            border-color: rgba(255, 248, 238, 0.24);
            color: #fff8ee;
          }

          .contrast .main-panel {
            right: 68px;
            top: 78px;
            width: 390px;
            height: 520px;
            border-radius: 30px;
            transform: rotate(1deg);
          }

          .contrast .side-panel {
            right: 388px;
            bottom: 62px;
            width: 250px;
            height: 332px;
            border-radius: 24px;
            transform: rotate(-3deg);
          }

          .contrast .seal {
            background: rgba(255, 248, 238, 0.94);
          }

          .contrast h1 {
            max-width: 610px;
            font-size: 64px;
          }
        </style>
      </head>
      <body>
        <main class="canvas ${thumbnail.theme === "proof" ? "proof-theme" : thumbnail.theme}">
          <div class="brand">
            <img src="${logo}" alt="" />
            <span>Echo</span>
          </div>
          <section class="copy">
            <p class="eyebrow">${thumbnail.eyebrow}</p>
            <h1>${thumbnail.title}</h1>
            <p class="subtitle">${thumbnail.subtitle}</p>
            <div class="proof">
              <span>Local-first</span>
              <span>Voice + video</span>
              <span>Sealed privacy</span>
            </div>
          </section>
          <figure class="panel main-panel" aria-hidden="true">
            <img src="${primary}" alt="" />
          </figure>
          <figure class="panel side-panel" aria-hidden="true">
            <img src="${secondary}" alt="" />
          </figure>
          <div class="seal" aria-hidden="true">
            <img src="${logo}" alt="" />
          </div>
        </main>
      </body>
    </html>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

  for (const thumbnail of thumbnails) {
    await page.setContent(await htmlFor(thumbnail), { waitUntil: "load" });
    await page.screenshot({
      path: path.join(outputDir, thumbnail.file),
      type: "jpeg",
      quality: 94,
      fullPage: false,
    });
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
