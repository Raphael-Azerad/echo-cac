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
    eyebrow: "ECHO",
    title: "Preserve who you were",
    subtitle: "A private time capsule for a future self",
    image: "docs/assets/submission/07-returned-echo-detail.jpg",
    variant: "artifact",
  },
  {
    file: "echo-thumbnail-02-human-place-time.jpg",
    eyebrow: "CONGRESSIONAL APP CHALLENGE",
    title: "A human. A place. A time.",
    subtitle: "Letters, voice, video, and context sealed for later",
    image: "docs/assets/submission/08-media-evidence-tray.jpg",
    variant: "evidence",
  },
  {
    file: "echo-thumbnail-03-notes-fail.jpg",
    eyebrow: "WHY ECHO EXISTS",
    title: "Notes save words. Echo saves the moment.",
    subtitle: "Local-first, private, and sealed until the future",
    image: "docs/assets/submission/01-home-returned-and-sealed.jpg",
    variant: "home",
  },
];

async function htmlFor(thumbnail) {
  const logo = await asset("outputs/echo/icon.svg");
  const screen = await asset(thumbnail.image);
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: GeorgiaLocal;
            src: local("Georgia");
          }

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
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .canvas {
            position: relative;
            width: 1280px;
            height: 720px;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            padding: 58px 72px;
            gap: 54px;
            background:
              linear-gradient(90deg, #f7efe3 0%, #f7efe3 46%, #eadcc9 100%);
          }

          .copy {
            align-self: center;
            display: grid;
            gap: 24px;
            z-index: 2;
          }

          .brand {
            display: inline-flex;
            align-items: center;
            gap: 14px;
            font-weight: 800;
            letter-spacing: 0.14em;
            font-size: 19px;
            color: #6a4a32;
          }

          .brand img {
            width: 58px;
            height: 58px;
            border-radius: 16px;
          }

          .eyebrow {
            margin: 0;
            color: #6d5e50;
            font-size: 19px;
            font-weight: 850;
            letter-spacing: 0.13em;
          }

          h1 {
            margin: 0;
            max-width: 690px;
            font-family: GeorgiaLocal, Georgia, serif;
            font-size: 74px;
            line-height: 0.96;
            font-weight: 500;
            letter-spacing: 0;
          }

          .subtitle {
            max-width: 560px;
            margin: 0;
            color: #67594c;
            font-size: 28px;
            line-height: 1.25;
            font-weight: 650;
          }

          .proof {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
          }

          .proof span {
            border: 1px solid #cbb99e;
            border-radius: 999px;
            padding: 9px 14px;
            background: rgba(255, 250, 242, 0.72);
            color: #4b3829;
            font-size: 17px;
            font-weight: 750;
          }

          .phone-wrap {
            position: relative;
            align-self: center;
            justify-self: center;
            width: 336px;
            height: 616px;
            border-radius: 48px;
            padding: 16px;
            background: #2c251f;
            box-shadow: 0 38px 80px rgba(55, 39, 24, 0.26);
            transform: rotate(2deg);
          }

          .phone-wrap::before {
            content: "";
            position: absolute;
            top: 9px;
            left: 50%;
            width: 96px;
            height: 24px;
            border-radius: 999px;
            background: #2c251f;
            transform: translateX(-50%);
            z-index: 2;
          }

          .phone {
            width: 100%;
            height: 100%;
            border-radius: 34px;
            overflow: hidden;
            background: #fff8ee;
          }

          .phone img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .seal {
            position: absolute;
            right: 34px;
            bottom: 30px;
            width: 142px;
            height: 142px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            border: 1px solid #cab79a;
            background: rgba(255, 248, 238, 0.76);
          }

          .seal img {
            width: 82px;
            height: 82px;
          }

          .variant-evidence .phone-wrap {
            transform: rotate(-2deg);
          }

          .variant-home h1 {
            font-size: 68px;
          }
        </style>
      </head>
      <body>
        <main class="canvas variant-${thumbnail.variant}">
          <section class="copy">
            <div class="brand">
              <img src="${logo}" alt="" />
              <span>Echo</span>
            </div>
            <p class="eyebrow">${thumbnail.eyebrow}</p>
            <h1>${thumbnail.title}</h1>
            <p class="subtitle">${thumbnail.subtitle}</p>
            <div class="proof">
              <span>Local-first</span>
              <span>Voice + video</span>
              <span>Sealed privacy</span>
            </div>
          </section>
          <section class="phone-wrap" aria-hidden="true">
            <div class="phone">
              <img src="${screen}" alt="" />
            </div>
          </section>
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
      quality: 92,
      fullPage: false,
    });
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
