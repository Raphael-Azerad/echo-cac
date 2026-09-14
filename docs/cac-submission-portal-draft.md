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
Echo is a private time-capsule app for preserving a person, a place, and a moment in time.

A user can write a letter to a future version of themselves, add voice or video, attach media, record their mood and hopes, and capture optional moment context like place, weather, and daylight. Then they seal the Echo until a future date. Before that date arrives, the app hides the title, letter, media, mood, place, weather, goals, and other emotional details from the normal interface.

When an Echo returns, it opens as a quiet archive artifact instead of a normal note. The goal is not just to save text. The goal is to help someone return to who they were, where they were, and what mattered at a specific moment before that version of life disappears into memory.
```

### What inspired you to create this app?

```text
I wanted to build something that felt more human than a notes app or journal. Most apps are good at storing files, but they are not good at preserving the full situation around a person: their voice, room, mood, hopes, and sense of time.

I kept thinking about people I wish I could hear from during important moments in their lives. I would want to hear Steve Jobs while he was still building, or a family member before life changed, or even myself before a big transition. Echo came from that idea. It tries to make a private record of a person in a place and time, then return it later when it can mean something different.

I also wanted the app to avoid the obvious path of becoming an AI chatbot. Echo is about preserving the user's real words and real context, not generating a synthetic version of them.
```

### What technical difficulties did you face programming your app?

```text
The hardest part was making the privacy model match the product idea. Echo is built around sealed content, so I had to make sure future letters were not accidentally visible in the home screen, archive, demo data, calendar export, delete dialogs, notifications, or early-access flows. I added an Archive Key that requires an exact typed phrase and resets after reload so early opening feels intentionally non-default.

Another challenge was combining several browser features into one polished flow. Echo uses IndexedDB/local storage for local-first persistence, MediaRecorder for voice and video, Web Speech API support for dictation, a responsive iPhone-style interface, import/export, calendar export, and a Node context API that only receives date and coordinates. The context API can enrich a moment with place, weather, and daylight without receiving the private letter.

I also built automated tests around the product rules, including sealed-content privacy, prompt behavior, media handling, accessibility, small-screen overflow, and API boundaries.
```

### What improvements would you make if you were to create a 2.0 version of your app?

```text
For a 2.0 version, I would keep Echo local-first but add optional encrypted sync so people could keep their Echoes across devices without giving up privacy. I would also improve return reminders with stronger scheduling, add a native mobile wrapper for iOS and Android, and build a more complete media capture studio for longer voice and video artifacts.

I would also like to add collaborative Echoes for families, teams, or classrooms, where multiple people can contribute to one sealed artifact before a shared future date. That would need careful permissions so sealed content still stays hidden until it returns.

Finally, I would make the context API production-ready with stronger deployment monitoring, more reliable geocoding and weather fallbacks, and optional user-controlled backup encryption. The most important rule for version 2.0 would be the same as version 1.0: the private letter should stay private unless the user chooses otherwise.
```

### Did you use AI in the creation, development, or functionality of your app?

Select:

- Yes

### Please list the AI tools you used and briefly explain how they helped. Then describe what your team designed, coded, changed, tested, or finalized yourselves.

```text
I used AI coding tools, including Codex/ChatGPT, during development. They helped me brainstorm product direction, review UI decisions, debug JavaScript and CSS issues, generate tests, improve documentation, and think through privacy and security edge cases.

The app itself is not an AI chatbot. Echo does not use AI to read sealed letters, summarize private content, or imitate the user. The current writing-polish affordance is intentionally small and works only on explicitly selected text.

My contribution was directing the product and making the final decisions: the idea, the privacy rules, the local-first approach, the writing and archive flow, the choice to avoid a chatbot, the visual direction, the demo path, and the final submission positioning. I tested the app, reviewed generated changes, rejected features that did not fit the product, and finalized the GitHub repo, README, screenshots, and CAC submission materials.
```

### What did you learn or take away from participating in the Congressional App Challenge?

```text
I learned that building a good app is not just adding features. The hardest and most important part is deciding what the app should refuse to become.

Echo could have easily turned into a journal, a notes app, a dashboard, or an AI companion. I had to keep returning to the central idea: preserve a human, a place, and a time. That shaped the interface, the privacy model, the archive, the demo behavior, and even what features I chose not to add.

Technically, I learned how much work goes into making a simple promise reliable. If an app says sealed letters stay hidden, then that has to be true across storage, UI, exports, notifications, demo data, and tests. I also learned how to use browser APIs like IndexedDB, MediaRecorder, Web Speech, service workers, and local file exports together in one product.

The biggest takeaway is that software can feel more meaningful when it is built around restraint. Echo became stronger when I stopped trying to make it bigger and focused on making it honest, private, and emotionally clear.
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
