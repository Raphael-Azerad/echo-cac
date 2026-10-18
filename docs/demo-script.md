# Echo CAC Demo Script

Target length: 2 minutes 40 seconds. Keep the final export under 3 minutes.

## Recording Script And Shot Plan

### 0:00-0:15 - Name, App, Purpose, And Audience

**On screen:** Echo Home, with the logo and returned/sealed states visible.

**Voiceover:**

"I'm Raphael Azerad, and this is Echo, a private time-capsule web app for students, families, creators, and anyone who wants to preserve a real moment for their future self."

### 0:15-0:33 - The Problem

**On screen:** Slowly move from Home into Write.

**Voiceover:**

"Most apps preserve files or polished posts. They lose the situation around a person: what they sounded like, where they were, what they hoped would happen, and what they did not know yet. Echo preserves that unfinished version of someone without turning it into public content."

### 0:33-1:12 - Create An Echo

**On screen:** Show the letter field, prompt tabs, active cue, voice, video, dictation, attachments, present-moment fields, future hope, and return date. Do not linger on every control.

**Voiceover:**

"A user can write freely or choose a prompt about a person, place, time, or future self. They can record their voice or video, dictate, add photographs, and save their mood, location, weather, and hopes. Echo's preservation meter quietly checks whether the artifact captures a human, a place, and a future return date. It never sends the letter away to calculate that."

### 1:12-1:37 - Seal And Privacy

**On screen:** Open the seal review, confirm it, show the receipt, then return Home.

**Voiceover:**

"Sealing requires a second deliberate action. Echo stores the record locally and creates a SHA-256 seal fingerprint. Before the return date, Home can show that an Echo is waiting, but it hides the title, letter, media names, mood, goals, place, and weather. Early access is behind an exact confirmation phrase and resets when the session ends."

### 1:37-2:02 - Return And Archive

**On screen:** Open the returned demo Echo. Pause on the return threshold, then reveal the archive artifact and evidence tray.

**Voiceover:**

"When an Echo returns, it does not silently become another note. The user first reaches a threshold showing when it was written and how long it waited. One final tap reveals the letter, media, place, weather, hopes, and the bridge between who the person was then and who they are now."

### 2:02-2:28 - Tools, Languages, And Technical Difficulty

**On screen:** Open Trust, then briefly show Technical Proof in Settings.

**Voiceover:**

"I built Echo with HTML, CSS, JavaScript, IndexedDB, MediaRecorder, the Web Speech API, service workers, and a small Node API packaged with Docker. The hardest problem was making sealed privacy hold across every surface, including lists, deletion, notifications, calendar exports, backups, and demo data. I turned those rules into Playwright tests across mobile and desktop. The context API receives only date and coordinates, never the private letter."

### 2:28-2:40 - AI Disclosure And Close

**On screen:** Return to the archive artifact or Echo logo.

**Voiceover:**

"AI tools assisted my development and debugging, but Echo itself is not an AI chatbot and does not send sealed writing to a model. Echo's purpose is simple: let your future self meet the real person who was here before."

## Recording Checklist

- Show Raphael's name, Echo's name, purpose, and target audience in the first 15 seconds.
- Say HTML, CSS, JavaScript, IndexedDB, browser media APIs, Node, and Docker clearly.
- Demonstrate real interaction instead of scrolling through static screens.
- Pause briefly at the seal review and return threshold.
- Keep the phone frame large enough for labels to remain readable.
- Use captions and clean voice audio.
- Do not describe the local writing-polish prototype as model-powered AI.
- Do not claim cloud sync, encryption, accounts, native iOS packaging, or a production deployment.
- Export between 1 and 3 minutes, then watch the uploaded public video from beginning to end.
