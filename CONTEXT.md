# Echo Context

Last reviewed: 2026-09-13

Echo is a private time-capsule product. It is not a dashboard, journal clone, AI chatbot, or productivity tracker.

## Domain Language

- **Echo**: a sealed message from the present self to a future self. It can contain a letter, media, voice, mood, goals, location, weather, and moment context.
- **Moment context**: the outer-world facts around an Echo: date, place, coordinates, weather, and daylight. It can be enriched by an API, but it must never require letter text.
- **Letter-writing room**: the creation mode. It should feel private, focused, and warm.
- **Archive**: the museum-like mode for Echoes that have returned. It should feel earned, quiet, and artifact-like.
- **Sealed Echo**: an Echo whose unlock date is still in the future. Its title, letter, media, mood, and emotional details are hidden by default.
- **Returned Echo**: an Echo whose unlock date has arrived. Its contents can be viewed in the Archive.
- **Arrival**: a returned Echo that has not been opened yet. Home may show it as ready, but it should still lead through the returned-preview moment before full archive detail.
- **Return threshold**: the final screen before a returned Echo opens. It may show generic preservation facts, the returned title, timing, media mix, and seal status, but not the letter or specific place/weather/goals/media filenames.
- **Return reminder**: an opt-in local browser notification that says an Echo has returned without naming the Echo or exposing letter text, media names, place, mood, goals, or emotional details.
- **Return calendar**: a downloadable `.ics` file for future return dates. It should help the user remember when to come back without putting sealed Echo content into outside calendar apps.
- **Archive Key**: the intentionally non-default setting that allows early viewing of sealed Echoes for editing, export, emergency recovery, or demos.
- **Seal fingerprint**: a local SHA-256 digest recorded when an Echo is sealed. It can prove the sealed payload's integrity later without revealing the letter in casual UI.
- **Polish**: a small local writing cleanup affordance. It must operate only on explicitly selected text and must preserve the writer's voice.
- **Local-first**: Echo data lives in browser storage by default. Export/import are portability features, not cloud sync.
- **Technical proof**: a hidden Settings section for judges and reviewers that explains API, Docker, and privacy boundaries without turning the everyday product into a developer dashboard.
- **Judge walkthrough**: a demo-only path for showing Echo's story, privacy rules, and technical proof without changing the everyday product surface.
- **Demo Echo**: a clearly labeled sample artifact. The default demo should load only one returned Echo; future sealed demo Echoes require an explicit full-demo action.
- **Human/place/time readiness**: a quiet creation signal that helps the writer see whether an Echo preserves the person, the setting, and the future return date without turning the product into a task checklist.
- **Preservation meter**: the creation-room expression of human/place/time readiness. It should feel like three anchored threads, not a score, streak, grade, or gamified checklist.

## Product Rules

- The Home screen may show that sealed Echoes exist, but not what they are about.
- Home should distinguish arrivals from opened returned Echoes so return day feels intentional, not like a normal list update.
- Returned Echoes should pass through a threshold moment before full archive detail so opening feels deliberate and irreversible enough to matter.
- Return reminders must be generic, opt-in, local browser alerts. They may say an Echo returned, but must never include private Echo content.
- Return calendar events must use generic copy. They must not include titles, letters, future-self labels, places, moods, goals, media names, or emotional details.
- The Archive should not casually browse future content. Early access belongs behind Settings.
- Enabling the Archive Key should require an intentional review that does not reveal sealed titles, letters, media names, place, mood, goals, or emotional details.
- Enabling the Archive Key should require typing the exact phrase `I understand this breaks the seal`, and the key should reset on reload.
- Prompting can support writing, but freewriting must remain first-class.
- Prompt text should appear as an active writing cue outside the letter field. It should never be inserted into the letter automatically, and switching to Freewrite should clear the cue.
- Video and voice are core inputs, not secondary attachments.
- Echo should preserve a human, a place, and a time without making the private letter readable by outside services.
- The preservation meter may respond to local form fields and attached media, but it must not send the letter anywhere or pressure the writer to optimize it.
- New Echoes should receive a local seal fingerprint at sealing time when browser crypto is available.
- AI must never become the center of the app. No chat surface without a deliberate product decision.
- The app should feel literary and intimate, not motivational, clinical, corporate, or template-like.
- Demo and judging surfaces should point into real product flows and must not make sealed content easier to browse.
- Demo loading should avoid surprising sealed counts. Load one returned demo by default; load future sealed demos only from an explicit full-demo action.
- Privacy pages and judge-facing proof should be concrete and plain. They can explain the architecture, but should not become the emotional center of the app.

## Engineering Rules

- Treat storage as a module with a small interface. Keep persistence logic isolated enough to swap IndexedDB for sync later.
- Test distinctive product behavior at user-visible seams: creation, sealing, reveal, Archive Key, export/import, media handling, and navigation.
- Prefer vertical slices: one behavior, one test, one implementation pass, then polish.
- Every feature must preserve accessibility, mobile usability, and locked-content privacy.
