import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile } from "node:fs/promises";

async function resetEcho(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase("echo-local");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
    localStorage.setItem("echo:onboarding-complete", "true");
  });
}

async function createFutureEcho(page) {
  await page.goto("/#create");
  await page.getByPlaceholder("A letter to later").fill("For my future self");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("This content should stay sealed until the future.");
  await page.getByLabel("Who are you writing to?").fill("After the challenge");
  await page.getByLabel("Open this Echo on").fill("2027-07-11");
  await page.getByRole("button", { name: "Hopeful" }).click();
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await page.getByRole("button", { name: "Seal until then" }).click();
  await expect(page).toHaveURL(/#sealed\//);
  await page.getByRole("button", { name: "Go home" }).click();
  await expect(page).toHaveURL(/#home$/);
}

async function seedReturnedEcho(page, overrides = {}) {
  return await page.evaluate(async (overrides) => {
    const echo = {
      id: "returned-build-room",
      title: "Letter from the build room",
      letter: "The work felt alive. Remember the room, the pressure, and the people who made it matter.",
      goals: "Keep building carefully.",
      futureHope: "I hope the future still feels close to this room.",
      futureSelf: "Me after launch",
      mood: "Hopeful",
      weather: "Clear evening",
      location: "Cupertino, California",
      createdAt: "2026-08-24T17:00:00.000Z",
      unlockAt: "2026-08-25T09:00:00.000Z",
      attachments: [
        {
          id: "voice-build-room",
          name: "Voice note from the build room.webm",
          type: "audio/webm",
          kind: "audio",
          size: 24,
          dataUrl: "data:audio/webm;base64,AAAA",
        },
        {
          id: "video-build-room",
          name: "Desk before launch.mp4",
          type: "video/mp4",
          kind: "video",
          size: 24,
          dataUrl: "data:video/mp4;base64,AAAA",
        },
        {
          id: "photo-build-room",
          name: "Room light.png",
          type: "image/png",
          kind: "image",
          size: 24,
          dataUrl: "data:image/png;base64,AAAA",
        },
      ],
      context: {
        capturedAt: "2026-08-24T17:00:00.000Z",
        source: "test",
        date: "2026-08-24",
        coordinates: { latitude: 37.33182, longitude: -122.03118 },
        place: { label: "Cupertino, California, United States" },
        weather: { summary: "Clear sky, 21C" },
      },
      ...overrides,
    };
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
      transaction.objectStore("echoes").put(echo);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    return echo.id;
  }, overrides);
}

async function installMockReturnNotifications(page, options = {}) {
  await page.addInitScript(({ initialPermission = "default", requestResult = "granted" }) => {
    const state = {
      permission: initialPermission,
      requestResult,
      requests: [],
      created: [],
    };
    class MockNotification {
      constructor(title, notificationOptions = {}) {
        state.created.push({
          title,
          body: notificationOptions.body,
          tag: notificationOptions.tag,
          silent: notificationOptions.silent,
        });
      }

      static get permission() {
        return state.permission;
      }

      static set permission(value) {
        state.permission = value;
      }

      static async requestPermission() {
        state.requests.push("requested");
        state.permission = state.requestResult;
        return state.permission;
      }
    }
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: MockNotification,
    });
    window.__echoNotificationState = state;
  }, options);
}

test("sealed Echoes stay hidden from Home and Archive until the key is enabled", async ({ page }) => {
  await resetEcho(page);
  await createFutureEcho(page);

  await expect(page.getByText("1 Echo waiting")).toBeVisible();
  await expect(page.getByText("For my future self")).toHaveCount(0);
  await expect(page.getByText("This content should stay sealed")).toHaveCount(0);

  await page.goto("/#archive");
  await expect(page.getByText("1 sealed")).toBeVisible();
  await expect(page.getByText("For my future self")).toHaveCount(0);

  await page.goto("/#settings");
  await page.getByRole("button", { name: "Allow early opening" }).click();
  await expect(page.getByRole("dialog", { name: "Open sealed Echoes early?" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1 sealed Echo");
  await expect(page.getByRole("dialog")).not.toContainText("For my future self");
  await expect(page.getByRole("dialog")).not.toContainText("This content should stay sealed");
  await page.getByRole("button", { name: "Keep sealed" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/#archive");
  await expect(page.locator(".early-section")).toHaveCount(0);
  await expect(page.getByText("For my future self")).toHaveCount(0);

  await page.goto("/#settings");
  await page.getByRole("button", { name: "Allow early opening" }).click();
  await page.getByRole("button", { name: "Unlock sealed Echoes" }).click();
  await expect(page.getByText("Type the full phrase to use the Archive Key.")).toBeVisible();
  await page.getByLabel("Type this exact phrase").fill("I understand");
  await page.getByRole("button", { name: "Unlock sealed Echoes" }).click();
  await expect(page.getByText("Type the full phrase to use the Archive Key.")).toBeVisible();
  await page.getByLabel("Type this exact phrase").fill("I understand this breaks the seal");
  await page.getByRole("button", { name: "Unlock sealed Echoes" }).click();
  await page.goto("/#archive");
  await expect(page.getByText("Early Access")).toBeVisible();
  await expect(page.getByText("For my future self")).toBeVisible();
  await page.reload();
  await expect(page.locator(".early-section")).toHaveCount(0);
  await expect(page.getByText("For my future self")).toHaveCount(0);

  await page.goto("/#settings");
  await page.getByRole("button", { name: "Allow early opening" }).click();
  await page.getByLabel("Type this exact phrase").fill("I understand this breaks the seal");
  await page.getByRole("button", { name: "Unlock sealed Echoes" }).click();
  await page.getByRole("button", { name: "Hide sealed Echoes again" }).click();
  await page.goto("/#archive");
  await expect(page.locator(".early-section")).toHaveCount(0);
  await expect(page.getByText("For my future self")).toHaveCount(0);
});

test("delete confirmation for sealed Echoes does not reveal hidden content", async ({ page }) => {
  await resetEcho(page);
  const nativeDialogs = [];
  page.on("dialog", (dialog) => {
    nativeDialogs.push(dialog.message());
    return dialog.dismiss();
  });
  await createFutureEcho(page);
  const echoId = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("echo-local", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("echoes", "readonly");
      const request = transaction.objectStore("echoes").getAll();
      request.onsuccess = () => resolve(request.result[0].id);
      request.onerror = () => reject(request.error);
    });
  });

  await page.goto(`/#echo/${echoId}`);
  await expect(page.getByText("For my future self")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete this sealed Echo?" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Sealed Echo");
  await expect(page.getByRole("dialog")).not.toContainText("For my future self");
  await expect(page.getByRole("dialog")).not.toContainText("This content should stay sealed");
  expect(nativeDialogs).toEqual([]);

  await page.getByRole("button", { name: "Keep Echo" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/#home");
  await expect(page.getByText("1 Echo waiting")).toBeVisible();

  await page.goto(`/#echo/${echoId}`);
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByText("No sealed Echoes yet")).toBeVisible();
});

test("returned Echoes stage the archive reveal before showing the letter", async ({ page }) => {
  await resetEcho(page);
  const echoId = await seedReturnedEcho(page);

  await page.goto(`/#echo/${echoId}`);
  await expect(page.getByRole("heading", { name: "This Echo has returned." })).toBeVisible();
  await expect(page.getByText("Letter from the build room")).toBeVisible();
  await expect(page.getByLabel("Before opening")).toContainText("Then");
  await expect(page.getByLabel("Before opening")).toContainText("Waiting");
  await expect(page.getByLabel("Before opening")).toContainText("Now");
  await expect(page.getByLabel("Before opening")).toContainText("1 day");
  await expect(page.getByText("Private until opened")).toBeVisible();
  await expect(page.getByText("The work felt alive")).toHaveCount(0);
  await expect(page.getByText("Cupertino, California, United States")).toHaveCount(0);
  await expect(page.getByText("Voice note from the build room.webm")).toHaveCount(0);
  await expect(page.getByLabel("Archive plaque")).toHaveCount(0);

  await page.getByRole("button", { name: "Open returned Echo" }).click();
  await expect(page.getByRole("heading", { name: "Letter from the build room" })).toBeVisible();
  await expect(page.getByLabel("Archive plaque")).toContainText("ECHO-RETURNED");
  await expect(page.getByLabel("Archive plaque")).toContainText("Preserved for");
  await expect(page.getByLabel("Archive plaque")).toContainText("1 day");
  await expect(page.getByLabel("Time capsule bridge")).toContainText("Then");
  await expect(page.getByLabel("Time capsule bridge")).toContainText("Now");
  await expect(page.getByLabel("Returned Echo exhibit")).toBeVisible();
  await expect(page.locator(".evidence-grid .media-tile")).toHaveCount(3);
  await expect(page.locator(".evidence-grid .compact-video-tile")).toHaveCount(1);
  await expect(page.locator(".evidence-grid .compact-audio-tile")).toHaveCount(1);
  await expect(page.locator(".evidence-grid video")).toHaveCount(0);
  await expect(page.locator(".evidence-grid audio")).toHaveCount(0);
  await expect(page.getByText("Captured media")).toBeVisible();
  await expect(page.getByText("1 voice note, 1 video, 1 photo")).toBeVisible();
  await expect(page.getByText("Voice note from the build room")).toBeVisible();
  await expect(page.getByText("Desk before launch")).toBeVisible();
  await expect(page.getByText("Room light")).toBeVisible();
  await expect(page.getByText("The work felt alive")).toBeVisible();
  await expect(page.getByLabel("Returned Echo exhibit")).toContainText("Cupertino, California, United States");

  await page.goto("/#home");
  await page.goto(`/#echo/${echoId}`);
  await expect(page.getByRole("heading", { name: "This Echo has returned." })).toHaveCount(0);
  await expect(page.getByText("The work felt alive")).toBeVisible();
});

test("Home stages returned Echoes as arrivals until the first open", async ({ page }) => {
  await resetEcho(page);
  const echoId = await seedReturnedEcho(page, { unlockAt: new Date().toISOString() });

  await page.goto("/#home");
  await expect(page.getByLabel("Returned arrivals")).toContainText("An Echo has returned.");
  await expect(page.getByLabel("Returned arrivals")).toContainText("Returned today");
  await expect(page.getByLabel("Returned arrivals")).toContainText("Letter from the build room");
  await expect(page.getByLabel("Returned arrivals")).not.toContainText("The work felt alive");
  await expect(page.getByLabel("Returned arrivals")).not.toContainText("Cupertino, California, United States");
  await expect(page.getByText("The archive is holding at the door.")).toBeVisible();

  await page.getByRole("button", { name: /Letter from the build room/ }).click();
  await expect(page).toHaveURL(new RegExp(`#echo/${echoId}$`));
  await expect(page.getByRole("heading", { name: "This Echo has returned." })).toBeVisible();
  await page.getByRole("button", { name: "Open returned Echo" }).click();
  await expect(page.getByText("The work felt alive")).toBeVisible();

  await page.goto("/#home");
  await expect(page.getByLabel("Returned arrivals")).toHaveCount(0);
  await expect(page.getByText("The archive is holding at the door.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Letter from the build room/ })).toBeVisible();
});

test("Home sends one private return reminder for unopened arrivals", async ({ page }, testInfo) => {
  await installMockReturnNotifications(page, { initialPermission: "granted" });
  await resetEcho(page);
  const echoId = await seedReturnedEcho(page, {
    id: `arrival-notify-${testInfo.project.name}`,
    title: "Private Arrival Title",
    letter: "Secret body should not notify anyone.",
    location: "Hidden Place",
    unlockAt: new Date().toISOString(),
  });
  await page.evaluate(() => localStorage.setItem("echo:return-reminders", "true"));

  await page.goto("/#home");
  await expect(page.getByLabel("Returned arrivals")).toContainText("Private Arrival Title");
  let state = await page.evaluate(() => window.__echoNotificationState);
  expect(state.created).toHaveLength(1);
  expect(state.created[0]).toMatchObject({
    title: "An Echo has returned.",
    body: "Open Echo when you are ready.",
    tag: `echo-returned-${echoId}`,
    silent: true,
  });
  expect(JSON.stringify(state.created)).not.toContain("Private Arrival Title");
  expect(JSON.stringify(state.created)).not.toContain("Secret body");
  expect(JSON.stringify(state.created)).not.toContain("Hidden Place");

  await page.goto("/#home");
  state = await page.evaluate(() => window.__echoNotificationState);
  expect(state.created).toHaveLength(1);

  await page.getByRole("button", { name: /Private Arrival Title/ }).click();
  await page.getByRole("button", { name: "Open returned Echo" }).click();
  await page.goto("/#home");
  state = await page.evaluate(() => window.__echoNotificationState);
  expect(state.created).toHaveLength(1);
});

test("prompt mode adds optional writing prompts without replacing freewrite", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await expect(page.getByRole("button", { name: "Freewrite" })).toHaveClass(/is-active/);
  await page.getByRole("button", { name: "Prompts" }).click();
  await expect(page.locator("#promptShelf")).toContainText("Human");
  await expect(page.locator("#promptShelf")).toContainText("Place");
  await expect(page.locator("#promptShelf")).toContainText("Time");
  await page.getByRole("tab", { name: "Future" }).click();
  await page.getByRole("button", { name: "What are you afraid I might forget?" }).click();
  await expect(page.locator("#activePromptCue")).toContainText("What are you afraid I might forget?");
  await expect(
    page.getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    ),
  ).toHaveValue("");
  await page.getByRole("tab", { name: "Place" }).click();
  await page.getByRole("button", { name: "What would I see if I stood in this room with you?" }).click();
  await expect(page.locator("#activePromptCue")).toContainText("What would I see if I stood in this room with you?");

  await expect(
    page.getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    ),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Freewrite" }).click();
  await expect(page.locator("#activePromptCue")).toBeHidden();
});

test("create draft stays local, restores in the writing room, and can be cleared", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByPlaceholder("A letter to later").fill("Private unfinished letter");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("This is not sealed yet, so it should not appear outside Write.");
  await page.getByLabel("Who are you writing to?").fill("Me after the first demo");
  await page.getByLabel("What I’m trying to become").fill("A calmer builder");
  await page.getByLabel("When this opens, I hope...").fill("I can tell the work still feels honest.");
  await page.getByRole("button", { name: "Restless" }).click();
  await expect(page.getByText("Draft saved locally.")).toBeVisible();

  await page.goto("/#home");
  await expect(page.getByText("Private unfinished letter")).toHaveCount(0);
  await expect(page.getByText("This is not sealed yet")).toHaveCount(0);

  await page.goto("/#create");
  await expect(page.getByPlaceholder("A letter to later")).toHaveValue("Private unfinished letter");
  await expect(
    page.getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    ),
  ).toHaveValue("This is not sealed yet, so it should not appear outside Write.");
  await expect(page.getByLabel("What I’m trying to become")).toHaveValue("A calmer builder");
  await expect(page.getByLabel("When this opens, I hope...")).toHaveValue("I can tell the work still feels honest.");
  await expect(page.getByRole("button", { name: "Restless" })).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "Clear draft" }).click();
  await expect(page.getByText("Draft cleared.")).toBeVisible();
  await page.goto("/#home");
  await page.goto("/#create");
  await expect(page.getByPlaceholder("A letter to later")).toHaveValue("");
});

test("create draft clears after sealing an Echo", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByPlaceholder("A letter to later").fill("Draft becomes sealed");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("Once sealed, the old draft should be gone.");
  await expect(page.getByText("Draft saved locally.")).toBeVisible();
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await page.getByRole("button", { name: "Seal until then" }).click();
  await expect(page).toHaveURL(/#sealed\//);
  await expect(page.getByRole("heading", { name: "Your Echo is away." })).toBeVisible();
  await expect(page.getByLabel("Sealed Echo receipt")).toContainText("8 words sealed");
  await expect(page.getByLabel("Sealed Echo receipt").locator("code")).toHaveText(/[A-F0-9]{4} [A-F0-9]{4} [A-F0-9]{4} [A-F0-9]{4}/);
  await expect(page.getByText("Draft becomes sealed")).toHaveCount(0);
  await expect(page.getByText("Once sealed, the old draft should be gone.")).toHaveCount(0);
  const savedEcho = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("echo-local", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("echoes", "readonly");
      const request = transaction.objectStore("echoes").getAll();
      request.onsuccess = () => resolve(request.result[0]);
      request.onerror = () => reject(request.error);
    });
  });
  expect(savedEcho.sealedAt).toBeTruthy();
  expect(savedEcho.sealDigest).toMatch(/^[a-f0-9]{64}$/);

  await page.goto("/#create");
  await expect(page.getByPlaceholder("A letter to later")).toHaveValue("");
  await expect(
    page.getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    ),
  ).toHaveValue("");
});

test("seal review requires a second deliberate action", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByPlaceholder("A letter to later").fill("Review before leaving");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("I want one last quiet check before this goes away.");
  await page.getByLabel("Who are you writing to?").fill("Me after the ceremony");
  await page.getByRole("button", { name: "Seal Echo" }).click();

  await expect(page.getByRole("dialog", { name: "Seal this Echo for Me after the ceremony?" })).toBeVisible();
  await expect(page.getByText("Review before leaving")).toBeVisible();
  await page.getByRole("button", { name: "Keep writing" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto("/#home");
  await expect(page.getByText("Review before leaving")).toHaveCount(0);
  await page.goto("/#create");
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await page.getByRole("button", { name: "Seal until then" }).click();
  await expect(page).toHaveURL(/#sealed\//);
  await expect(page.getByRole("heading", { name: "Your Echo is away." })).toBeVisible();
  await expect(page.getByLabel("Sealed Echo receipt")).toContainText("Human and time started");
  await expect(page.getByText("Review before leaving")).toHaveCount(0);
  const sealedReceiptUrl = page.url();
  await page.evaluate(() => localStorage.removeItem("echo:sealed-receipt"));
  await page.goto("/#home");
  await page.goto(sealedReceiptUrl);
  await expect(page.getByRole("heading", { name: "This one is still away." })).toBeVisible();
  await expect(page.getByText("Review before leaving")).toHaveCount(0);
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByText("1 Echo waiting")).toBeVisible();
});

test("creation requires a future unlock date before sealing", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  const today = await page.evaluate(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });

  await page.getByPlaceholder("A letter to later").fill("Not yet future");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("This should wait for a true future date.");
  await page.getByLabel("Open this Echo on").fill(today);
  await page.getByRole("button", { name: "Seal Echo" }).click();

  await expect(page.getByText("Choose a future date for this Echo.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/#home");
  await expect(page.getByText("No sealed Echoes yet")).toBeVisible();
});

test("writing polish only changes selected text", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  const letter = page.getByPlaceholder(
    "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
  );
  await letter.fill("first sentence. second   sentence  !");
  await letter.evaluate((element) => {
    element.focus();
    element.setSelectionRange(16, element.value.length);
  });
  await page.getByRole("button", { name: "Polish selected text" }).click();

  await expect(letter).toHaveValue("first sentence. Second sentence!");
});

test("dictation shows a clear local fallback when speech recognition is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
  });
  await resetEcho(page);
  await page.goto("/#create");
  await page.getByRole("button", { name: /Dictate/ }).click();
  await expect(page.getByText("Dictation is not available in this browser.")).toBeVisible();
});

test("voice recording handles microphone permission denial", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: class MediaRecorder {} });
  });
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByRole("button", { name: /Voice note/ }).click();

  await expect(page.getByRole("dialog", { name: "Record a voice note." })).toBeVisible();
  await page.getByRole("button", { name: "Start voice" }).click();
  await expect(page.getByText("Microphone permission was not granted.")).toBeVisible();
  await expect(page.getByText("Open the room")).toBeVisible();
});

test("video recording handles camera permission denial from the capture studio", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: class MediaRecorder {} });
  });
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByRole("button", { name: /Video note/ }).click();

  await expect(page.getByRole("dialog", { name: "Record a video note." })).toBeVisible();
  await page.getByRole("button", { name: "Start video" }).click();
  await expect(page.getByText("Camera or microphone permission was not granted.")).toBeVisible();
});

test("capture studio attaches recorded video locally", async ({ page }) => {
  await page.addInitScript(() => {
    window.__stoppedTracks = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.resolve({
            getTracks: () => [
              {
                stop: () => {
                  window.__stoppedTracks += 1;
                },
              },
            ],
          }),
      },
    });
    class FakeMediaRecorder {
      constructor() {
        this.ondataavailable = null;
        this.onstop = null;
      }
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob(["video"], { type: "video/webm" }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });
  });
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByRole("button", { name: /Video note/ }).click();
  await page.getByRole("button", { name: "Start video" }).click();
  await expect(page.getByText("Recording video.")).toBeVisible();
  await page.getByRole("button", { name: "Stop and attach" }).click();

  await expect(page.getByText("Video note added.")).toBeVisible();
  await expect(page.locator(".attachment-preview")).toHaveCount(1);
  await expect(page.locator("#artifactSummary")).toContainText("1 video");
  expect(await page.evaluate(() => window.__stoppedTracks)).toBe(1);
});

test("capture studio rejects oversized recordings before attaching", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.resolve({
            getTracks: () => [{ stop: () => {} }],
          }),
      },
    });
    class FakeMediaRecorder {
      constructor() {
        this.ondataavailable = null;
        this.onstop = null;
      }
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob([new Uint8Array(9 * 1024 * 1024)], { type: "video/webm" }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });
  });
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByRole("button", { name: /Video note/ }).click();
  await page.getByRole("button", { name: "Start video" }).click();
  await page.getByRole("button", { name: "Stop and attach" }).click();

  await expect(page.getByText("Video note skipped. Keep attachments under 8 MB each.")).toBeVisible();
  await expect(page.locator(".attachment-preview")).toHaveCount(0);
  await expect(page.locator("#artifactSummary")).toContainText("No media yet");
});

test("moment context capture never sends letter text to the API", async ({ page }) => {
  await page.addInitScript(() => {
    window.__contextRequests = [];
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success) =>
          success({
            coords: {
              latitude: 37.33182,
              longitude: -122.03118,
            },
          }),
      },
    });
    window.fetch = (input, init = {}) => {
      window.__contextRequests.push({
        url: String(input),
        method: init.method || "GET",
        body: init.body || "",
      });
      return Promise.resolve(
        new Response(
          JSON.stringify({
            capturedAt: "2026-09-02T15:00:00.000Z",
            source: "echo-context-api",
            date: "2026-09-02",
            coordinates: { latitude: 37.33182, longitude: -122.03118 },
            place: { label: "Cupertino, California, United States" },
            weather: { summary: "Clear sky, 21C", temperature: 21, unit: "C" },
            daylight: { sunrise: "2026-09-02T06:39", sunset: "2026-09-02T19:33" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    };
  });
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByPlaceholder("A letter to later").fill("Building something human");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("I wish I could speak to Steve Jobs when he was still building.");
  await page.getByRole("button", { name: /Moment/ }).click();

  await expect(page.getByText("Moment context captured.")).toBeVisible();
  await expect(page.getByText("Cupertino, California, United States")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Location" })).toHaveValue("Cupertino, California, United States");
  await expect(page.getByRole("textbox", { name: "Weather" })).toHaveValue("Clear sky, 21C");

  const requests = await page.evaluate(() => window.__contextRequests);
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe("GET");
  expect(requests[0].url).toContain("lat=37.33182");
  expect(requests[0].url).toContain("lon=-122.03118");
  expect(requests[0].url).not.toContain("Steve");
  expect(requests[0].body).toBe("");

  await page.getByRole("button", { name: "Seal Echo" }).click();
  await expect(page.getByRole("dialog")).toContainText("Place and time captured");
  await page.getByRole("button", { name: "Seal until then" }).click();

  const savedContext = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("echo-local", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("echoes", "readonly");
      const request = transaction.objectStore("echoes").getAll();
      request.onsuccess = () => resolve(request.result[0].context);
      request.onerror = () => reject(request.error);
    });
  });
  expect(savedContext.place.label).toBe("Cupertino, California, United States");
});

test("dictation recovers when the browser speech service hangs", async ({ page }) => {
  await page.addInitScript(() => {
    class HangingSpeechRecognition {
      start() {}
      stop() {}
      abort() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: HangingSpeechRecognition });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
  });
  await resetEcho(page);
  await page.goto("/#create");
  await page.getByRole("button", { name: /Dictate/ }).click();
  await expect(page.getByText("Dictation starting.")).toBeVisible();
  await expect(page.getByText("Dictation could not start in this browser.")).toBeVisible({ timeout: 4000 });
  await expect(page.getByRole("button", { name: /Dictate/ })).toBeVisible();
});

test("Settings centralizes configuration and applies theme globally", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#settings");

  for (const section of ["Profile", "Preferences", "Integrations", "Trust", "API Keys", "Archive Key", "Data", "Prototype"]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("Context API endpoint")).toBeHidden();
  await page.getByText("Technical proof").click();
  await expect(page.getByText("It turns date and coordinates into place, weather, and daylight.")).toBeVisible();
  await expect(page.getByText("Echo never sends the letter, title, mood, goals, or media.")).toBeVisible();
  await expect(page.getByLabel("Context API endpoint")).toBeVisible();

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/#home");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/#settings");
  await page.getByRole("button", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
});

test("Settings enables and disables opt-in return reminders", async ({ page }) => {
  await installMockReturnNotifications(page, { initialPermission: "default", requestResult: "granted" });
  await resetEcho(page);
  await page.goto("/#settings");

  const reminders = page.locator(".preference-row", { hasText: "Return reminders" });
  await expect(reminders).toContainText("Off");
  await reminders.locator("[data-action='toggleReturnReminders']").click();
  await expect(page.getByText("Return reminders enabled.")).toBeVisible();
  await expect(reminders).toContainText("On");

  const state = await page.evaluate(() => window.__echoNotificationState);
  expect(state.requests).toEqual(["requested"]);
  expect(await page.evaluate(() => localStorage.getItem("echo:return-reminders"))).toBe("true");

  await reminders.locator("[data-action='toggleReturnReminders']").click();
  await expect(page.getByText("Return reminders turned off.")).toBeVisible();
  await expect(await page.evaluate(() => localStorage.getItem("echo:return-reminders"))).toBe("false");
});

test("Trust layer explains the privacy architecture and can check the context API", async ({ page }) => {
  await page.addInitScript(() => {
    window.__healthRequests = [];
    window.fetch = (input) => {
      window.__healthRequests.push(String(input));
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true, service: "echo-context-api", privacy: "letters-never-required" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    };
  });
  await resetEcho(page);
  await page.goto("/#settings");

  await page.getByRole("button", { name: "Open trust layer" }).click();
  await expect(page).toHaveURL(/#trust$/);
  await expect(page.getByRole("heading", { name: "Built to preserve a human, not extract one." })).toBeVisible();
  await expect(page.getByText("New Echoes receive a local SHA-256 fingerprint")).toBeVisible();
  await expect(page.getByText("The Docker-ready API receives only date and coordinates.")).toBeVisible();
  await expect(page.getByText("Echo has no chatbot")).toBeVisible();

  await page.getByRole("button", { name: "Check context API" }).click();
  await expect(page.getByText("Context API healthy. Letters stay local.")).toBeVisible();
  expect(await page.evaluate(() => window.__healthRequests)).toEqual(["http://localhost:8787/api/health"]);
});

test("privacy route gives judges a direct policy surface without exposing letter data", async ({ page, request }) => {
  await resetEcho(page);
  await createFutureEcho(page);
  await page.goto("/#settings");

  await page.getByRole("button", { name: "Privacy page" }).click();
  await expect(page).toHaveURL(/#privacy$/);
  await expect(page).toHaveTitle("Privacy · Echo");
  await expect(page.getByRole("heading", { name: "Your letter should not become someone else's data." })).toBeVisible();
  await expect(page.getByText("Echo does not send letter text")).toBeVisible();
  await expect(page.getByText("Promptfoo policy gate")).toBeVisible();
  await expect(page.getByText("For my future self")).toHaveCount(0);
  await expect(page.getByText("This content should stay sealed")).toHaveCount(0);

  const standalone = await request.get("/privacy.html");
  expect(standalone.ok()).toBe(true);
  const html = await standalone.text();
  expect(html).toContain("Privacy · Echo");
  expect(html).toContain("Your letter should not become someone else's data.");
});

test("unknown routes show a calm missing-page state instead of falling through to Home", async ({ page }) => {
  await resetEcho(page);
  await createFutureEcho(page);

  await page.goto("/#this-room-does-not-exist");
  await expect(page).toHaveTitle("Not Found · Echo");
  await expect(page.getByRole("heading", { name: "This room does not exist yet." })).toBeVisible();
  await expect(page.getByText("For my future self")).toHaveCount(0);
  await expect(page.getByText("This content should stay sealed")).toHaveCount(0);

  await page.getByRole("button", { name: "Write" }).first().click();
  await expect(page).toHaveURL(/#create$/);
});

test("demo Echoes help the walkthrough without exposing sealed titles", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#settings");
  await page.getByRole("button", { name: "Load demo Echo" }).click();

  await page.goto("/#home");
  await expect(page.getByText("Before the first prototype")).toBeVisible();
  await expect(page.getByText("Demo sealed Echo")).toHaveCount(0);
  await expect(page.getByText("After judging day")).toHaveCount(0);
  await expect(page.getByText("One year from here")).toHaveCount(0);
  await expect(page.getByText("If you are reading this")).toHaveCount(0);

  await page.goto("/#settings");
  await page.getByRole("button", { name: "Load full demo set" }).click();
  await page.goto("/#home");
  await expect(page.getByText("Demo sealed Echo 1")).toBeVisible();
  await expect(page.getByText("After judging day")).toHaveCount(0);
});

test("Archive presents returned Echoes as cataloged artifacts without exposing sealed Echoes", async ({ page }) => {
  await resetEcho(page);
  await seedReturnedEcho(page);
  await createFutureEcho(page);

  await page.goto("/#archive");
  await expect(page.getByText("Artifact 01")).toBeVisible();
  await expect(page.getByText("Letter from the build room")).toBeVisible();
  await expect(page.getByLabel("Artifact facts")).toContainText("Me after launch");
  await expect(page.getByLabel("Artifact facts")).toContainText("Cupertino, California, United States");
  await expect(page.getByLabel("Artifact facts")).toContainText("1 voice note, 1 video, 1 photo");
  await expect(page.getByText("1 sealed")).toBeVisible();
  await expect(page.getByText("For my future self")).toHaveCount(0);
  await expect(page.getByText("This content should stay sealed")).toHaveCount(0);
});

test("judge walkthrough prepares the demo and links to the real product surfaces", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#settings");
  await page.getByRole("button", { name: "Open walkthrough" }).click();

  await expect(page).toHaveURL(/#demo$/);
  await expect(page.getByRole("heading", { name: "Capture a human, a place, and a time." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A clean two-minute path for the video." })).toBeVisible();
  await expect(page.getByText("Files survive. The feeling of being there usually does not.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Artifact reveal" })).toBeVisible();
  await expect(page.getByText("The app is local-first, tested for sealed-content privacy")).toBeVisible();
  await expect(page.getByLabel("0 total Echoes")).toBeVisible();
  await expect(page.getByLabel("0 demo Echoes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Returned demo" })).toBeDisabled();

  await page.getByRole("button", { name: "Prepare demo Echo" }).click();
  await expect(page.getByText("Demo Echo loaded.")).toBeVisible();
  await expect(page.getByLabel("1 total Echoes")).toBeVisible();
  await expect(page.getByLabel("1 demo Echoes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Returned demo" })).toBeEnabled();

  await page.getByLabel("Run the demo without breaking").getByRole("button", { name: "Home" }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByText("Before the first prototype")).toBeVisible();
  await expect(page.getByText("After judging day")).toHaveCount(0);

  await page.goto("/#demo");
  await page.getByRole("button", { name: "Returned demo" }).click();
  await expect(page.getByRole("heading", { name: "This Echo has returned." })).toBeVisible();
  await expect(page.getByText("I am building this because")).toHaveCount(0);

  await page.goto("/#demo");
  await page.getByLabel("Run the demo without breaking").getByRole("button", { name: "Archive" }).click();
  await expect(page).toHaveURL(/#archive$/);
  await expect(page.getByText("Only what has come back belongs here.")).toBeVisible();
});

test("live walkthrough seeds rich media and opens the returned artifact preview", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#demo");

  await page.getByRole("button", { name: "Start live walkthrough" }).click();
  await expect(page).toHaveURL(/#echo\//);
  await expect(page.getByRole("heading", { name: "This Echo has returned." })).toBeVisible();
  await expect(page.getByText("I am building this because")).toHaveCount(0);
  await expect(page.getByText("Voice note from the build room.wav")).toHaveCount(0);

  await page.getByRole("button", { name: "Open returned Echo" }).click();
  await expect(page.locator(".archive-object")).toHaveClass(/is-newly-opened/);
  await expect(page.getByLabel("Returned Echo exhibit")).toContainText("1 voice note, 1 video, 1 photo");
  await expect(page.locator(".evidence-grid .media-tile")).toHaveCount(3);
  await expect(page.locator(".evidence-grid .static-video-tile")).toHaveCount(1);
  await expect(page.locator(".evidence-grid .compact-audio-tile")).toHaveCount(1);
  await expect(page.locator(".evidence-grid audio")).toHaveCount(0);
  await expect(page.locator(".evidence-grid video")).toHaveCount(0);
  await expect(page.getByLabel("Returned Echo exhibit")).toContainText("I hope the future version can tell whether the work still feels honest.");
  await expect(page.getByText("Voice note from the build room")).toBeVisible();
  await expect(page.getByText("Thirty seconds before the demo")).toBeVisible();
  await expect(page.getByText("Desk light before launch")).toBeVisible();
  await expect(page.getByLabel("Returned Echo exhibit")).toContainText("A small build room near Cupertino");
  await expect(page.getByText("I am building this because")).toBeVisible();
});

test("Settings can clear local demo Echoes", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#settings");
  await page.getByRole("button", { name: "Load demo Echo" }).click();
  await expect(page.getByText("1 saved")).toBeVisible();
  await page.getByRole("button", { name: "Clear demo Echoes" }).click();
  await expect(page.getByText("0 saved")).toBeVisible();
  await page.goto("/#home");
  await expect(page.getByText("Before the first prototype")).toHaveCount(0);
  await expect(page.getByText("Demo sealed Echo 1")).toHaveCount(0);
});

test("Settings exports a local JSON backup", async ({ page }) => {
  await resetEcho(page);
  await createFutureEcho(page);
  await page.goto("/#settings");

  await page.getByRole("button", { name: "Export backup" }).click();
  await expect(page.getByRole("dialog", { name: "Export backup with sealed Echoes?" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1 hidden Echo");
  await expect(page.getByRole("dialog")).not.toContainText("For my future self");
  await expect(page.getByRole("dialog")).not.toContainText("This content should stay sealed");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export local backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^echo-backup-\d{4}-\d{2}-\d{2}\.json$/);

  const path = await download.path();
  const payload = JSON.parse(await readFile(path, "utf8"));
  expect(payload.product).toBe("Echo");
  expect(payload.schemaVersion).toBe(1);
  expect(payload.echoes).toHaveLength(1);
  expect(payload.echoes[0].title).toBe("For my future self");
});

test("Settings exports a privacy-safe return calendar", async ({ page }) => {
  await resetEcho(page);
  await createFutureEcho(page);
  await page.goto("/#settings");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export return calendar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^echo-returns-\d{4}-\d{2}-\d{2}\.ics$/);

  const path = await download.path();
  const calendar = await readFile(path, "utf8");
  expect(calendar).toContain("BEGIN:VCALENDAR");
  expect(calendar).toContain("SUMMARY:Echo returns");
  expect(calendar).toContain("A private Echo is ready to open.");
  expect(calendar).not.toContain("For my future self");
  expect(calendar).not.toContain("This content should stay sealed");
  expect(calendar).not.toContain("After the challenge");
});

test("sealed receipt exports only the generic return date", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");
  await page.getByPlaceholder("A letter to later").fill("Calendar private title");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("The calendar file should never carry this sealed letter.");
  await page.getByLabel("Who are you writing to?").fill("Me after the calendar test");
  await page.getByLabel("Open this Echo on").fill("2027-07-11");
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await page.getByRole("button", { name: "Seal until then" }).click();
  await expect(page.getByRole("heading", { name: "Your Echo is away." })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add return date" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const calendar = await readFile(path, "utf8");
  expect(calendar).toContain("BEGIN:VEVENT");
  expect(calendar).toContain("SUMMARY:Echo returns");
  expect(calendar).not.toContain("Calendar private title");
  expect(calendar).not.toContain("sealed letter");
  expect(calendar).not.toContain("calendar test");
});

test("Settings imports a local Echo backup without exposing sealed titles", async ({ page }, testInfo) => {
  await resetEcho(page);
  const backupPath = testInfo.outputPath("echo-import.json");
  const importedEchoId = `imported-future-echo-${testInfo.project.name.toLowerCase()}`;
  await writeFile(
    backupPath,
    JSON.stringify({
      product: "Echo",
      schemaVersion: 1,
      exportedAt: "2026-08-24T17:00:00.000Z",
      echoes: [
        {
          id: importedEchoId,
          title: "Imported Future Letter",
          letter: "Imported sealed body should stay private.",
          futureSelf: "Me after launch",
          mood: "Hopeful",
          goals: "Restore carefully.",
          weather: "Clear",
          location: "Desk",
          createdAt: "2026-08-24T17:00:00.000Z",
          unlockAt: "2027-08-24T17:00:00.000Z",
          attachments: [],
        },
      ],
    }),
    "utf8",
  );

  await page.goto("/#settings");
  await page.locator("#backupInput").setInputFiles(backupPath);
  await expect(page.getByRole("status")).toHaveText("Imported 1 Echo.");
  await expect(page.getByText("1 saved")).toBeVisible();
  await page.locator("#backupInput").setInputFiles(backupPath);
  await expect(page.getByRole("status")).toHaveText("No new Echoes were imported.");
  await expect(page.getByText("1 saved")).toBeVisible();

  await page.goto("/#home");
  await expect(page.getByText("Sealed Echo 1")).toBeVisible();
  await expect(page.getByText("Imported Future Letter")).toHaveCount(0);
  await expect(page.getByText("Imported sealed body should stay private.")).toHaveCount(0);

  await page.goto("/#settings");
  await page.getByRole("button", { name: "Allow early opening" }).click();
  await page.getByLabel("Type this exact phrase").fill("I understand this breaks the seal");
  await page.getByRole("button", { name: "Unlock sealed Echoes" }).click();
  await page.goto("/#archive");
  await expect(page.getByText("Imported Future Letter")).toBeVisible();
});

test("Settings rejects malformed backup imports", async ({ page }, testInfo) => {
  await resetEcho(page);
  const backupPath = testInfo.outputPath("not-echo.json");
  await writeFile(backupPath, JSON.stringify({ product: "Notes", schemaVersion: 1, echoes: [] }), "utf8");

  await page.goto("/#settings");
  await page.locator("#backupInput").setInputFiles(backupPath);
  await expect(page.getByText("That backup does not look like an Echo export.")).toBeVisible();
  await expect(page.getByText("0 saved")).toBeVisible();
});

test("Settings imports only safe attachment data URLs from backups", async ({ page }, testInfo) => {
  await resetEcho(page);
  const backupPath = testInfo.outputPath("echo-import-unsafe-media.json");
  const importedEchoId = `imported-media-echo-${testInfo.project.name.toLowerCase()}`;
  await writeFile(
    backupPath,
    JSON.stringify({
      product: "Echo",
      schemaVersion: 1,
      exportedAt: "2026-09-14T17:00:00.000Z",
      echoes: [
        {
          id: importedEchoId,
          title: "Imported media proof",
          letter: "Only the safe attachment should survive import.",
          futureSelf: "Me after the audit",
          mood: "Hopeful",
          goals: "Keep the archive clean.",
          createdAt: "2026-09-12T17:00:00.000Z",
          unlockAt: "2026-09-13T17:00:00.000Z",
          attachments: [
            {
              id: "safe-audio",
              name: "Safe voice note.webm",
              type: "audio/webm",
              kind: "audio",
              size: 4,
              dataUrl: "data:audio/webm;base64,AAAA",
            },
            {
              id: "html-disguised-as-image",
              name: "Disguised HTML.png",
              type: "image/png",
              kind: "image",
              size: 10,
              dataUrl: "data:text/html,%3Cscript%3Ealert(1)%3C/script%3E",
            },
            {
              id: "svg-image",
              name: "Scriptable vector.svg",
              type: "image/svg+xml",
              kind: "image",
              size: 10,
              dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
            },
          ],
        },
      ],
    }),
    "utf8",
  );

  await page.goto("/#settings");
  await page.locator("#backupInput").setInputFiles(backupPath);
  await expect(page.getByRole("status")).toHaveText("Imported 1 Echo.");
  await page.evaluate((id) => localStorage.setItem("echo:opened-returned", JSON.stringify([id])), importedEchoId);
  await page.goto(`/#echo/${importedEchoId}`);

  await expect(page.locator(".evidence-grid .media-tile")).toHaveCount(1);
  await expect(page.getByText("Safe voice note")).toBeVisible();
  await expect(page.getByText("Disguised HTML")).toHaveCount(0);
  await expect(page.getByText("Scriptable vector")).toHaveCount(0);
});

test("oversized media attachments are skipped before saving", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  const fileInput = page.locator("#mediaInput");
  await fileInput.setInputFiles({
    name: "too-large-video.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.alloc(9 * 1024 * 1024),
  });

  await expect(page.getByText("1 file skipped. Keep attachments under 8 MB each.")).toBeVisible();
  await expect(page.locator(".attachment-preview")).toHaveCount(0);
});

test("media attachments can be removed before sealing", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await page.locator("#mediaInput").setInputFiles({
    name: "quiet-room.png",
    mimeType: "image/png",
    buffer: Buffer.from("not-a-real-image"),
  });
  await expect(page.locator(".attachment-preview")).toHaveCount(1);

  await page.getByRole("button", { name: "Remove quiet-room.png" }).click();
  await expect(page.getByText("Attachment removed.")).toBeVisible();
  await expect(page.locator(".attachment-preview")).toHaveCount(0);

  await page.getByPlaceholder("A letter to later").fill("No media now");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("The attached image was removed before sealing.");
  await page.getByRole("button", { name: "Seal Echo" }).click();
  await expect(page.getByText("No media attached")).toBeVisible();
});

test("artifact summary and seal review distinguish media types before locking", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await expect(page.locator("#artifactSummary")).toContainText("Not written yet");
  await expect(page.locator("#artifactSummary")).toContainText("No media yet");
  await expect(page.getByLabel("Preservation readiness")).toContainText("Time started");
  await expect(page.locator(".preservation-thread.is-ready")).toContainText("Time");
  await expect(page.locator(".preservation-thread.is-ready")).toContainText("Anchored");
  await expect(page.getByRole("progressbar", { name: "Preserved threads" })).toHaveAttribute("aria-valuenow", "1");
  await page.locator("#mediaInput").setInputFiles([
    {
      name: "room.png",
      mimeType: "image/png",
      buffer: Buffer.from("not-a-real-image"),
    },
    {
      name: "room-video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("not-a-real-video"),
    },
    {
      name: "voice-memory.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("not-a-real-audio"),
    },
  ]);

  await expect(page.locator("#artifactSummary")).toContainText("1 video, 1 photo, 1 audio note");
  await expect(page.getByLabel("Preservation readiness")).toContainText("Human, place, and time captured");
  await expect(page.locator(".preservation-thread.is-ready strong")).toHaveText(["Human", "Place", "Time"]);
  await expect(page.getByRole("progressbar", { name: "Preserved threads" })).toHaveAttribute("aria-valuenow", "3");
  await page.getByPlaceholder("A letter to later").fill("The room before launch");
  await page
    .getByPlaceholder(
      "Write as if you are speaking to someone who knows you completely, but has not seen this day in a long time.",
    )
    .fill("Remember the desk, the pressure, and the sound of this exact night.");
  await page.getByLabel("Who are you writing to?").fill("Me after the launch");
  await page.getByRole("button", { name: "Seal Echo" }).click();

  const dialog = page.getByRole("dialog", { name: "Seal this Echo for Me after the launch?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("12 words");
  await expect(dialog).toContainText("3 attachments");
  await expect(dialog).toContainText("1 video, 1 photo, 1 audio note");
  await expect(dialog).toContainText("Human, place, and time captured");
});

test("long Echo titles wrap in the writing room instead of clipping sideways", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#create");

  await page.getByPlaceholder("A letter to later").fill("A room worth remembering before everything changes");
  const titleMetrics = await page.locator("#title").evaluate((field) => ({
    clientHeight: field.clientHeight,
    scrollHeight: field.scrollHeight,
    clientWidth: field.clientWidth,
    scrollWidth: field.scrollWidth,
  }));
  expect(titleMetrics.clientHeight).toBeGreaterThan(90);
  expect(titleMetrics.scrollWidth).toBeLessThanOrEqual(titleMetrics.clientWidth + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test("slow local work does not repaint an old route after navigation", async ({ page }) => {
  await resetEcho(page);
  await page.goto("/#settings");
  await page.getByRole("button", { name: "Load demo Echo" }).click({ noWaitAfter: true });
  await page.goto("/#create");
  await expect(page.getByRole("heading", { name: "Create a new Echo" })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole("heading", { name: "Create a new Echo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep Echo quiet, private, and yours." })).toHaveCount(0);
});

test("install metadata gives Echo an iPhone-style app shell", async ({ page, request }) => {
  await resetEcho(page);
  await page.goto("/");

  const metadata = await page.evaluate(() => ({
    manifest: document.querySelector("link[rel='manifest']")?.getAttribute("href"),
    icon: document.querySelector("link[rel='icon']")?.getAttribute("href"),
    appleIcon: document.querySelector("link[rel='apple-touch-icon']")?.getAttribute("href"),
    appTitle: document.querySelector("meta[name='apple-mobile-web-app-title']")?.getAttribute("content"),
    capable: document.querySelector("meta[name='apple-mobile-web-app-capable']")?.getAttribute("content"),
    statusBar: document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']")?.getAttribute("content"),
    themeColor: document.querySelector("meta[name='theme-color']")?.getAttribute("content"),
  }));

  expect(metadata).toEqual({
    manifest: "./manifest.webmanifest",
    icon: "./icon.svg",
    appleIcon: "./icon-maskable.svg",
    appTitle: "Echo",
    capable: "yes",
    statusBar: "black-translucent",
    themeColor: "#f7f0e6",
  });

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Echo");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("./#home");
  expect(manifest.categories).toEqual(["lifestyle", "utilities"]);
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "./icon.svg", purpose: "any" }),
      expect.objectContaining({ src: "./icon-maskable.svg", purpose: "maskable" }),
    ]),
  );

  const serviceWorker = await (await request.get("/service-worker.js")).text();
  expect(serviceWorker).toContain("./index.html");
  expect(serviceWorker).toContain("./privacy.html");
  expect(serviceWorker).toContain("./app.js");
  expect(serviceWorker).toContain("./manifest.webmanifest");
  expect(serviceWorker).not.toContain("/api/context/moment");
});

test("core routes set specific browser titles for app switching and recording", async ({ page }) => {
  await resetEcho(page);
  const returnedEchoId = await seedReturnedEcho(page);
  const routes = [
    ["#home", "Home · Echo"],
    ["#create", "Write · Echo"],
    ["#archive", "Archive · Echo"],
    ["#settings", "Settings · Echo"],
    ["#trust", "Trust · Echo"],
    ["#privacy", "Privacy · Echo"],
    ["#demo", "Walkthrough · Echo"],
    [`#echo/${returnedEchoId}`, "Letter from the build room · Echo"],
  ];

  for (const [hash, title] of routes) {
    await page.goto(`/${hash}`);
    await expect(page).toHaveTitle(title);
  }
});

test("app registers the offline shell when service workers are available", async ({ page }) => {
  await page.addInitScript(() => {
    window.__registeredServiceWorkers = [];
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: (url) => {
          window.__registeredServiceWorkers.push(url);
          return Promise.resolve({ scope: "/" });
        },
      },
    });
  });
  await resetEcho(page);
  await page.goto("/");

  await expect.poll(() => page.evaluate(() => window.__registeredServiceWorkers)).toEqual(["./service-worker.js"]);
});

test("core screens have no obvious accessibility violations in light and dark themes", async ({ page }) => {
  await resetEcho(page);
  const routeHeadings = {
    "#home": "Preserve who you are before time changes you.",
    "#create": "Create a new Echo",
    "#archive": "Only what has come back belongs here.",
    "#settings": "Keep Echo quiet, private, and yours.",
    "#trust": "Built to preserve a human, not extract one.",
    "#privacy": "Your letter should not become someone else's data.",
    "#demo": "Capture a human, a place, and a time.",
    "#unknown-room": "This room does not exist yet.",
  };

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => localStorage.setItem("echo:theme", value), theme);
    for (const hash of ["#home", "#create", "#archive", "#settings", "#trust", "#privacy", "#demo", "#unknown-room"]) {
      await page.goto(`/${hash}`);
      await expect(page.getByRole("heading", { name: routeHeadings[hash] })).toHaveCount(1);
      await page.waitForTimeout(100);
      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations, `${theme} ${hash} accessibility violations`).toEqual([]);
    }
  }
});

test("main screens do not create horizontal overflow on small phones", async ({ page }) => {
  await resetEcho(page);
  await seedReturnedEcho(page, { id: "overflow-returned", title: "Demo: Before the first prototype", demo: true });
  await seedReturnedEcho(page, {
    id: "overflow-sealed",
    title: "A sealed title that must stay hidden",
    unlockAt: "2027-09-14T09:00:00.000Z",
    demo: true,
    demoRole: "future",
  });

  for (const viewport of [
    { width: 300, height: 650 },
    { width: 320, height: 700 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const hash of ["#home", "#create", "#archive", "#settings", "#trust", "#privacy", "#demo", "#unknown-room"]) {
      await page.goto(`/${hash}`);
      await page.locator(".app-view").first().waitFor();
      const overflowing = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        return [...document.querySelectorAll("*")]
          .filter((element) => !element.matches(".sr-only, .route-anchor"))
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") return false;
            const rect = element.getBoundingClientRect();
            if (rect.width < 16 || rect.height < 8) return false;
            const elementOverflow = element.scrollWidth > element.clientWidth + 3;
            const viewportOverflow = rect.right > viewportWidth + 1 || rect.left < -1;
            return elementOverflow || viewportOverflow;
          })
          .map((element) => ({
            tag: element.tagName,
            className: element.className,
            text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            rect: Math.round(element.getBoundingClientRect().right),
          }));
      });

      expect(overflowing, `${viewport.width}px ${hash} overflowing elements`).toEqual([]);
    }
  }
});
