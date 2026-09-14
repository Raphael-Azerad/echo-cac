# Echo

Echo is a private time-capsule app for preserving a person, a place, and a moment in time.

The app lets someone write a letter to a future version of themselves, add voice or video, capture the context around the moment, and seal the Echo until a future date. Until that date arrives, Echo hides the title, letter, media, mood, place, weather, and other emotional details from the everyday interface.

Echo is built for the Congressional App Challenge as a local-first prototype. It is not a journal clone, a notes app, or an AI chatbot. The product goal is simple: make it possible to return to a real moment from your life with enough context that it still feels human.

## Screenshots

The CAC cover image is available at `docs/assets/echo-cover-600x800.jpg`. It is a `600x800` JPEG, matching the portal's preferred 3:4 cover-photo size.

The upload-ready submission set is in `docs/assets/submission/`. It includes ten `600x800` JPEGs covering the home screen, writing room, prompt flow, present/future fields, archive privacy, returned Echo detail, media evidence tray, trust layer, and technical proof. A short silent product walkthrough is also available at `docs/assets/submission/echo-demo-walkthrough.webm`.

<p>
  <img src="docs/assets/echo-cover-600x800.jpg" alt="Echo home screen cover image" width="220">
  <img src="docs/assets/echo-write.jpg" alt="Echo writing room with voice, video, dictation, media, and moment controls" width="220">
  <img src="docs/assets/echo-archive.jpg" alt="Echo archive screen with returned demo artifact and sealed-content privacy" width="220">
</p>

## Why This Exists

Most apps preserve files. Echo preserves the situation around a person before that moment disappears.

Someone can save what they sounded like, what room they were in, what they hoped would happen, and what they wanted their future self to remember. A student could seal an Echo before graduation. A founder could record the first prototype. A family member could preserve a specific day before life changes.

The large idea is identity over time. Echo gives ordinary people a way to leave a private artifact for a future self without turning the artifact into public content.

## What The App Does

- Creates sealed Echoes with a letter, future open date, present-moment details, future hopes, mood, and optional media.
- Records voice and video with browser media APIs.
- Supports local dictation when the browser provides speech recognition.
- Captures optional moment context through an API that receives only date and coordinates.
- Shows returned Echoes as archive artifacts after their open date.
- Hides sealed Echo content by default.
- Requires an intentional Archive Key phrase before early opening.
- Exports and imports local JSON backups.
- Exports privacy-safe calendar reminders that do not include sealed titles or letter text.
- Installs as an iPhone-style progressive web app shell.

## Privacy Model

Echo is local-first. Letters, media, mood, goals, and sealed details stay in browser storage unless the user exports a backup.

The context API does not receive private writing. It accepts only:

- `lat`
- `lon`
- `date`

It returns place, weather, and daylight context. The API response includes a privacy contract, and the test suite verifies that letter text is not sent to the API.

The app also avoids casual access to future content. Sealed Echoes can be counted as waiting, but their titles, media names, letter text, mood, goals, and location details stay hidden until the Echo returns or the user deliberately enables the Archive Key.

## Technical Architecture

Echo is a static web app with a small Node context API.

- Frontend: HTML, CSS, and JavaScript in `outputs/echo/`.
- Storage: IndexedDB and local browser storage.
- Media: MediaRecorder, file attachments, and local object/data URLs.
- Dictation: Web Speech API when available.
- Context API: Node HTTP server in `api/server.js`.
- External context sources: Open-Meteo for weather and BigDataCloud for reverse geocoding.
- PWA shell: manifest, icons, and service worker.
- Docker: one static frontend service and one context API service.
- Tests: Playwright browser tests, Node API tests, and Promptfoo policy checks.

This structure keeps the prototype easy to run while still showing real technical decisions around privacy, media capture, browser storage, API boundaries, offline behavior, and regression testing.

## AI Disclosure

AI coding tools assisted development, research, debugging, and review.

Echo itself is not an AI chatbot. The current app includes a small writing-polish prototype that works on explicitly selected text and does not call an AI model. The repository includes Promptfoo checks for future AI features so that any later model integration must preserve consent, privacy, and sealed-content boundaries.

## Running Locally

Install dependencies:

```sh
npm install
```

Run the frontend:

```sh
npm run serve
```

Open:

```text
http://127.0.0.1:4174
```

Run the context API in another terminal:

```sh
npm run serve:api
```

API health check:

```text
http://127.0.0.1:8787/api/health
```

## Running With Docker

```sh
docker compose up --build
```

Services:

- Frontend: `http://localhost:4174`
- Context API: `http://localhost:8787`

## Quality Checks

Run the full local quality gate:

```sh
npm run quality
```

This runs:

- JavaScript syntax checks.
- Playwright browser tests across mobile and desktop profiles.
- Node API tests for the context service.
- Promptfoo checks for AI feature boundaries.

Current coverage focuses on the product rules that matter most: sealed-content privacy, Archive Key behavior, prompt behavior, media handling, import/export safety, accessibility, route behavior, PWA metadata, and API privacy.

## Demo Path

For a short judge demo:

1. Open the walkthrough screen.
2. Load the demo Echo.
3. Show that sealed Echoes stay hidden.
4. Open Write and show letter writing, voice/video capture, media attachments, moment context, and selected-text polish.
5. Open the Trust or Settings area and explain the local-first privacy model.
6. Open a returned Echo and show the archive reveal.

The strongest way to explain Echo is: it captures a human, a place, and a time before the present becomes unreachable.

## Future Work

Echo should stay local-first until cloud sync is worth the privacy cost. Future work could add encrypted sync, native mobile packaging, stronger reminder scheduling, and a production deployment. Those features should sit behind the existing storage and privacy boundaries instead of replacing them.
