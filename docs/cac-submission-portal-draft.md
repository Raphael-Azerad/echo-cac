# Echo CAC Submission Portal Draft

Use this as the copy source for the Congressional App Challenge portal. Fields marked `TBD` need a final decision or a public link before submission.

## About Your App

### What is your app called?

Echo

### Which programming language(s) did you use to create your app?

Select:

- JavaScript
- Other

If the portal asks for details under Other:

```text
HTML, CSS, Node.js
```

Reasoning: the app is a static JavaScript web app with HTML/CSS UI and a small Node.js context API. I would not select Python unless the portal is counting the local development server, because Python is not part of the app itself.

### Which platform(s) did you code your app for?

Recommended selection:

- Web

Optional if the portal lets you clarify that it is a progressive web app:

- Mobile (iOS)
- Mobile (Android)

Suggested wording if a text explanation is available:

```text
Echo is a responsive web app built with an iPhone-style primary experience. It can run in a desktop browser, mobile browser, or installed PWA-style shell.
```

### Please list the link to your app's video demonstration here.

```text
TBD - add the final public HTTPS video link here.
```

Important: the portal says the video must begin with `https` and be public. A private GitHub video link is not enough for final submission. Use an unlisted YouTube video, a public Vimeo link, or another public HTTPS video page.

### Please briefly describe what your app does.

```text
Echo is a private time-capsule web app for preserving a person, a place, and a moment in time.

In Echo, a user writes a letter to a future version of themselves. They can also record voice or video, attach media, save their mood and hopes, and capture optional moment context such as place, weather, and daylight. Then they choose a future return date and seal the Echo.

The privacy behavior is the main product idea. Before an Echo returns, the app hides its title, letter, media, mood, place, weather, goals, and other personal details from the normal interface. The home screen can show that something is waiting, but not what it contains. If the user wants early access, they have to turn on an intentional Archive Key that requires typing an exact phrase.

When an Echo returns, it opens as an archive artifact instead of a normal note. The goal is not just to store text. Echo tries to preserve enough of a moment that a future self can remember who they were, what they sounded like, where they were, and what mattered then.

Technically, Echo is a local-first JavaScript web app with IndexedDB storage, media capture, import/export, a PWA shell, and a small Docker-ready Node context API. The API only receives date and coordinates for moment context; it does not receive the private letter.
```

### What inspired you to create this app?

```text
I wanted to build an app that felt more human than a notes app. A note can preserve words, but it usually loses the situation around those words: the room, the voice, the weather, the nervousness before a change, or the hope someone had before they knew what would happen next.

The idea started from thinking about people I wish I could hear from during important moments in their lives. I would want to hear a family member before a major transition, a founder before their idea worked, or even myself before a version of my life ended. Not because the recording would be perfect, but because it would be real.

That became Echo's central rule: preserve the user's real words and real context, then return them later. I did not want to turn the app into an AI chatbot or a public social feed. The point is not to generate a synthetic version of someone or make memories more shareable. The point is to let a person leave a private artifact for their future self.

That inspiration shaped the technical choices too. Echo is local-first because the content is personal. It supports voice, video, attachments, and moment context because memory is more than typed text. It hides sealed content because a time capsule should actually stay sealed until the return date matters.
```

### What technical difficulties did you face programming your app?

```text
The hardest technical problem was making the privacy model match the product promise. Echo is built around sealed content, so it was not enough to hide the letter on one screen. I had to check every place future content could accidentally appear: the home screen, archive lists, returned-preview screens, demo data, import/export flows, calendar reminders, delete dialogs, notifications, and early-access controls.

I handled that by turning the product idea into concrete rules. A sealed Echo can be counted as waiting, but its title, letter, media names, mood, goals, place, and weather stay hidden. Early access is behind an Archive Key that requires the exact phrase "I understand this breaks the seal" and resets after reload. I also added automated tests around sealed-content privacy so the rule is checked repeatedly instead of trusted by memory.

Another challenge was combining several browser features into one smooth app. Echo uses IndexedDB/local storage for persistence, MediaRecorder for voice and video, Web Speech API support for dictation, local file attachments, JSON import/export, privacy-safe calendar export, PWA files, and a Node context API. The context API enriches a moment with place, weather, and daylight while receiving only date and coordinates, not the letter.

The biggest programming lesson was that a simple user promise can create many edge cases. I had to keep testing small flows, tightening copy, and checking that every technical feature still served the same purpose: preserving a human, a place, and a time without casually exposing private content.
```

### What improvements would you make if you were to create a 2.0 version of your app?

```text
For a 2.0 version, I would keep Echo local-first but add optional encrypted sync. Right now, the privacy advantage is that Echo data stays in the browser unless the user exports it. The tradeoff is that a user has to manage backups and cannot easily move between devices. Version 2.0 should support cross-device use, but only with encryption and clear disclosure about what leaves the device.

I would also improve reminders. Echo has privacy-safe return reminders and calendar export ideas, but a production version should have stronger scheduling, better notification reliability, and native mobile support so returned Echoes feel more dependable on iOS and Android.

Another direction is collaborative Echoes. A family, classroom, team, or group of friends could contribute to one sealed artifact before a shared future date. That would be powerful, but it would need careful permissions: who can add content, who can see it after the return date, and whether anyone can break the seal early.

On the technical side, I would make the context API more production-ready with monitoring, stronger fallbacks for geocoding and weather, and a clearer deployment path. I would also improve media storage limits, backup encryption, and accessibility testing.

The most important 2.0 rule would stay the same: Echo should not become a generic journal, social network, or AI companion. New features should make the original promise stronger: preserve the real person, the real moment, and the future return.
```

### Did you use AI in the creation, development, or functionality of your app?

Select:

- Yes

### Please list the AI tools you used and briefly explain how they helped. Then describe what your team designed, coded, changed, tested, or finalized yourselves.

```text
Yes, I used AI coding tools, including Codex/ChatGPT, while developing Echo. They helped with brainstorming, implementation support, debugging JavaScript and CSS, reviewing edge cases, writing and improving tests, and polishing documentation.

I am disclosing that because AI was part of the development process, but the app itself is not an AI chatbot. Echo does not use AI to read sealed letters, summarize private content, imitate the user, or generate a fake future self. The current writing-polish interaction is intentionally small: it is a selected-text prototype and does not call an AI model in this version. The repo also includes Promptfoo policy checks so any future AI feature would have to respect consent, privacy, and sealed-content boundaries.

My contribution was the product direction and final implementation judgment. I chose the core idea, the local-first privacy model, the sealed-content rules, the writing and archive flow, the decision to avoid a chat-first product, and the demo story. I reviewed generated suggestions, changed or rejected work that did not fit Echo, tested the app, and finalized the README, screenshots, submission materials, and quality checks.

I can explain how the app works: the frontend is HTML/CSS/JavaScript, data is stored locally with IndexedDB/browser storage, media is captured with browser APIs, and the Node context API only receives date and coordinates. AI helped me move faster, but it did not replace understanding the code or making the final product decisions.
```

### What did you learn or take away from participating in the Congressional App Challenge?

```text
I learned that building a good app is not only about adding features. It is also about deciding what the app should protect, what it should refuse to do, and how every technical decision supports that promise.

Echo could have drifted into several easier categories: a journal, a notes app, a productivity tracker, a cloud storage tool, or an AI companion. The CAC process forced me to keep asking what made the idea different. The answer was the same each time: Echo captures a human, a place, and a time, then keeps that artifact sealed until it returns.

Technically, I learned how many details sit behind a simple sentence like "sealed content stays hidden." That promise has to hold across storage, home screens, archive views, media handling, exports, calendar reminders, notifications, demo data, and tests. I also learned how to connect browser APIs like IndexedDB, MediaRecorder, Web Speech, service workers, and local file export into one product instead of treating them as separate experiments.

I also learned to use AI coding tools responsibly. They were helpful for development, but they made it even more important for me to understand the architecture, test the behavior, and decide what belonged in the app. My main takeaway is that software feels stronger when the technical work and the product values match.
```

### Please include a cover photo from your app.

Use:

```text
docs/assets/echo-cover-600x800.jpg
```

This file is already a JPEG at the portal's preferred `600x800` size.

### Optional project link for judges

Current safe option:

```text
Leave blank until there is a public demo/app link or until the GitHub repo is intentionally made public.
```

If you decide to include GitHub later:

```text
https://github.com/Raphael-Azerad/echo-cac
```

Do not submit the private GitHub link unless judges will have access. A private repo link may look broken to them.

## Congressional Certification

### Portal checkbox

The portal offers:

```text
Yes, I'd like to learn more about being Congressional Certified
```

Recommended answer for now:

```text
Yes
```

Reason: opting in only says you want to learn more. It does not force you to make the repo public immediately.

### Should you actually get certified?

My recommendation: yes, but only near the end, after the video and repo are polished.

The certification requires three things: open-source the project on GitHub with a README, enter the Congressional App Challenge, and submit the repo to Hack Club. Since Echo already has a polished README, tests, Docker files, screenshots, and a clean commit history, certification is realistic. The tradeoff is that certification appears to require the project to be public/open-source, so if you are worried about people copying the idea, wait until the submission package is basically final.

Recommended timing:

```text
Opt in now. Keep the repo private for the moment. Make it public only when the video and CAC portal answers are final or almost final.
```

## About Your Process

### Where did you do most of the coding for your app?

Select:

- At Home

### On what date did you complete the coding for your app?

```text
TBD - use the final code-freeze date, not today's date if you are still polishing.
```

Suggested approach:

```text
Use the date when the final video/demo build is finished and you stop making meaningful code changes.
```

### Did you create this app as part of a project for school, a coding club, or a similar organization?

Recommended answer unless this was formally assigned:

- No

If you select `No`, leave the teacher/mentor fields blank.

### If completed as a project, please list the name of the school or organization here.

```text
Leave blank unless you answer Yes above.
```

### If completed as a project, please list the name of the teacher or mentor here.

```text
Leave blank unless you answer Yes above.
```

### If completed as a project, please list the email address of the teacher or mentor here.

```text
Leave blank unless you answer Yes above.
```

### Did an App Challenge Ambassador refer you to the Congressional App Challenge? If so, please list their email address here.

```text
Leave blank unless someone specifically referred you.
```

## Final Confirmation

### Application Ready to Submit

Do not select `Yes` until these are done:

- Final public HTTPS video link is ready.
- Cover photo is uploaded.
- All long responses are pasted and checked in the portal.
- Final code/demo date is accurate.
- Optional project link decision is made.
- Repo visibility decision is made.
- You have previewed or saved the draft without errors.

Recommended answer right now:

```text
No / leave incomplete until final submission day.
```

## Final Missing Inputs

You still need to provide or decide:

- Final public video URL.
- Whether to make the GitHub repo public before submission or after the CAC portal is complete.
- Final code-freeze date.
- Whether a teacher, mentor, school, club, or ambassador should be credited.
- Whether to deploy a public web-app preview link or rely on the video.
