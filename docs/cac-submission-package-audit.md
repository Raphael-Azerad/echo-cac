# Echo CAC Submission Package Audit

- Original audit: 2026-09-14
- Project-state refresh: 2026-10-18

Scope reviewed:

- `docs/cac-submission-portal-draft.md`
- `docs/cac-optimized-400-word-responses.md`
- `docs/demo-script.md`
- `docs/ai-usage-disclosure.md`
- `README.md`
- `docs/assets/submission/`

External spot-checks used and refreshed on October 18:

- CAC 2026 student rules and rulebook: any programming language/platform is allowed, submissions are due October 26, 2026, the demo video should be 1-3 minutes, and the video must be uploaded to YouTube or Vimeo and set to public.
- CAC judging criteria: quality of idea, implementation/user experience/design, and demonstrated coding/programming skill.
- Hack Club Congressional App Challenge Finalist Award pages: certification expects an eligible CAC submission, a public GitHub repository with a README, and a playable project link in the CAC submission.

The official CAC pages currently agree on the October 26 date but show conflicting deadline times. The [2026 rulebook](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf) says noon Eastern while the [student registration page](https://www.congressionalappchallenge.us/students/student-registration/) says 9:00 p.m. Eastern. Treat the deadline displayed inside the submission portal as authoritative and submit well before either time.

No main submission draft files were edited.

## Overall Readiness

The written package is strong and mostly judge-ready. The answers are specific to Echo, aligned with the product's privacy-by-default identity, and substantially under the apparent 400-word ceiling. The biggest remaining risks are not copy quality; they are portal mechanics and personal facts that only the submitter can finalize.

Current readiness: the code repository is submission-ready. The remaining blockers are the final public narrated video, completion date, source/app access decision, and personal attribution fields.

## Repository And Quality State

Verified October 18, 2026:

- The current submission branch is `main`.
- All visible Git commits are authored and committed as Raphael Azerad, with no co-author or assistant attribution.
- `npm run quality` covers 88 Playwright browser-test executions, 2 Node API tests, and 4 offline Promptfoo policy checks.
- The README, Docker setup, PWA assets, screenshots, silent walkthrough, thumbnails, API documentation, and AI disclosure are present.
- The repository should remain private until Raphael deliberately changes the visibility for a public demo, certification, or judging access.
- The comprehensive internal handoff used for response writing is intentionally excluded from Git so a future public repository stays focused on the product.

The six response drafts in `docs/cac-optimized-400-word-responses.md` are the latest response set stored in this repository. They were last reviewed September 14. If Raphael finalized newer personal essays in another conversation, those files are not present here and should be supplied before replacing the stored drafts.

## Word Count Check

All optimized long responses are comfortably under 400 words:

| Response | Count |
| --- | ---: |
| App description | 225 |
| Inspiration | 223 |
| Technical difficulties | 245 |
| 2.0 improvements | 239 |
| AI tools disclosure/team contribution | 233 |
| CAC takeaway | 219 |

## Media Asset Check

`docs/assets/submission/` contains 11 files:

- `01-home-returned-and-sealed.jpg`
- `02-write-room-media-first.jpg`
- `03-writing-prompts-tabs.jpg`
- `04-active-writing-cue.jpg`
- `05-present-and-future-fields.jpg`
- `06-archive-privacy.jpg`
- `07-returned-echo-detail.jpg`
- `08-media-evidence-tray.jpg`
- `09-trust-layer.jpg`
- `10-settings-technical-proof.jpg`
- `echo-demo-walkthrough.webm`

Findings:

- The 10 numbered JPEG screenshots are clearly named and all verified at `600x800`.
- The cover photo referenced by the portal draft, `docs/assets/echo-cover-600x800.jpg`, exists and is also verified at `600x800`, but it is outside `docs/assets/submission/`.
- The local WebM walkthrough exists and is small enough to be easy to upload elsewhere, but a local `.webm` file is not a final CAC portal video link.
- I could not verify the WebM duration in this environment because `ffprobe`, `ffmpeg`, `mediainfo`, and `exiftool` were unavailable, and a Playwright metadata check was blocked by the local browser sandbox.

## Must Decide

1. Final public video URL

The portal draft correctly marks this as `TBD`. This is the top blocker. The 2026 CAC rulebook says the video should be uploaded to YouTube or Vimeo and set to public. A local WebM, private GitHub file, or non-public link is not enough.

Concrete next step: upload the final narrated demo to YouTube or Vimeo, set it to public, confirm it starts with `https`, and paste that URL into the portal draft.

2. Final narrated video content

`docs/demo-script.md` is polished, but the two-minute path does not explicitly include all required CAC video elements: participant name(s), app name, one-sentence purpose, target audience, tools/languages, and functionality. It covers app purpose, technology, and functionality well, but name(s) and target audience need to be spoken directly.

Concrete next step: before recording, add a first sentence like: "I'm Raphael Azerad, and this is Echo, a private time-capsule web app for students, families, creators, and anyone who wants to send a real moment back to their future self."

3. Final completion/code-freeze date

The portal draft still has `TBD` for the completion date. This must be the date meaningful coding stops, not necessarily the date the audit was written.

Concrete next step: decide the final code-freeze date after the demo build is final.

4. Public repo/app access strategy

The current portal draft recommends leaving the optional project link blank unless there is a public demo or public GitHub repo. That is safe for avoiding a broken private link, but judges may request access to the app or source. Hack Club certification also expects a public GitHub repo and playable link.

Concrete next step: choose one submission posture:

- CAC only: submit public YouTube/Vimeo video, keep repo private, and be ready to provide source/app access if judges request it.
- CAC plus certification: make GitHub public, add/confirm a license, provide a playable deployed app link, and use that same playable link in the CAC submission.

5. Personal attribution fields

The draft cannot know whether a teacher, mentor, school project, coding club, or App Challenge Ambassador should be credited. Those fields need the user's personal input.

Concrete next step: confirm whether Echo was formal school/club work, whether a teacher/mentor should be listed, and whether an ambassador referred the submission.

6. AI disclosure ownership wording

The AI disclosure is responsible and transparent, but the line "My contribution was the product direction and final implementation judgment" could read slightly less coder-owned than ideal under the rulebook's emphasis on student technical contribution. Also, "finalized the README, screenshots, submission materials, and quality checks" should only remain if the student is comfortable claiming that exact scope.

Concrete next step: personalize this answer with one or two concrete things the student personally coded or debugged. For example: storage/privacy rules, MediaRecorder handling, API request boundaries, Playwright tests, or the Archive Key flow.

## Should Polish

1. Strengthen the demo script's judge checklist coverage

The script is emotionally strong and on-brand, but it should open with the required factual checklist before moving into the story. Judges may be scoring quickly.

Suggested structure:

- Name(s) and app name.
- One-sentence purpose.
- Target audience.
- Languages/tools.
- Live functionality.
- What was hard and how it was solved.

2. Reduce repeated "human, place, and time" phrasing across pasted answers

The phrase is accurate and central to Echo, but it appears often across the description, technical challenge, 2.0, takeaway, README, and demo script. Repetition helps brand memory; too much can sound generated.

Concrete next step: keep the phrase in the app description and final takeaway, but swap in more specific wording elsewhere, such as "voice, setting, and future return date" or "letter, media, and moment context."

3. Add more personal specificity to the inspiration answer

The inspiration answer is persuasive and not overclaimed, but it would become harder to dismiss as polished generic copy if it included one real personal detail. It does not need to be dramatic.

Concrete next step: replace one abstract example with a true origin detail, such as the kind of transition, memory, or person that made the time-capsule idea feel necessary.

4. Tighten the AI disclosure for CAC rule optics

The disclosure correctly says AI assisted development and that Echo itself is not an AI chatbot. For judges, it should also emphasize that AI did not make the app independently and that the student understands the code.

Concrete next step: include one sentence naming what the student can explain live: IndexedDB storage, sealed-content filtering, MediaRecorder capture, the `/api/context/moment` request shape, and the test suite.

5. Keep repository claims concrete

The current visible history has ten focused commits, all authored and committed as Raphael Azerad. The repository also has a README, tests, Docker files, and screenshots. Those facts are verified. "Clean commit history" is subjective, so the more concrete wording is still better for submission materials.

Concrete next step: say "a documented repository with automated tests, Docker files, and submission media" instead of relying on the phrase "clean commit history."

6. Be careful with "Promptfoo policy gate"

The Promptfoo mention is truthful based on `package.json`, docs, and tests, but it may sound like jargon to non-technical judges. It is strongest when paired with the practical meaning: future AI behavior has a privacy test before it ships.

Concrete next step: in spoken/video form, say "Promptfoo checks for future AI privacy rules" instead of relying on "policy gate" alone.

7. Clarify the writing-polish feature

The app contains a "Polish selected text" control. Since the portal asks about AI, judges may assume this is AI-powered. The current disclosure says it is local and does not call a model, which is good.

Concrete next step: keep saying "local selected-text polish prototype" unless or until it actually calls an AI model.

## Optional

1. Copy the cover image into the submission folder

The cover exists at `docs/assets/echo-cover-600x800.jpg`, but the rest of the upload set lives in `docs/assets/submission/`. For portal packaging clarity, consider adding a duplicate named `docs/assets/submission/00-cover-echo-600x800.jpg`.

2. Add a tiny asset manifest

The README already lists the media set, but a `docs/assets/submission/README.md` could make final upload simpler by saying which image is the cover, which screenshots are optional, and which video must be replaced by the public URL.

3. Export the final video in the portal's preferred platform format

The local WebM is fine for README playback, but YouTube/Vimeo workflows are often smoother with `.mp4` plus captions. This is not a CAC requirement from the rulebook, just a packaging convenience.

4. Include a short live-access note for judges

If no public app link is submitted, keep a short note ready in case judges request access: how to run locally, which command starts the app, and what demo path to use.

## Final Missing Inputs

The user still needs to provide or decide:

- Final public YouTube/Vimeo video URL.
- Final completion/code-freeze date.
- Whether to submit CAC only or CAC plus Hack Club certification.
- Whether the GitHub repo should become public before submission.
- Whether there will be a deployed playable app link.
- Whether any teacher, mentor, school, club, or App Challenge Ambassador should be credited.
- Exact participant name(s) to say in the video.
- Exact personal contribution details to include in the AI disclosure.

## Recommended Next Steps

1. Record the updated 1-3 minute script in `docs/demo-script.md`, which now explicitly includes participant name, Echo's name, purpose, target audience, tools/languages, functionality, technical difficulty, and AI disclosure.
2. Upload the video to YouTube or Vimeo as public and paste the `https` URL into the portal draft.
3. Decide whether the optional project link stays blank, points to a deployed app, or points to a public GitHub repo.
4. Choose the final code-freeze date.
5. Personalize the inspiration and AI-disclosure answers with details only the student can truthfully provide.
6. If pursuing Hack Club certification, make the repo public, confirm it has a license, confirm the README runs cleanly for a stranger, and provide a playable project link.

## Bottom Line

The copy is persuasive, under limit, and aligned with Echo. The media set is strong and clearly named. The package should not be submitted yet because the required public video link, completion date, access strategy, and personal attribution details are still unresolved.
