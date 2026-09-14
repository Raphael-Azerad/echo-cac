# Echo Repo Cleanup Audit

Last reviewed: 2026-09-14

## Summary

The repo is in strong shape for a private CAC submission. The README opens with a polished product-style presentation, the media files are organized, the app has a repeatable screenshot/video generation flow, and basic link checks passed.

No major repo-blocking issue was found in this pass.

## Must Fix Before Submission

- **Public video URL is still missing.**
  - Path: `docs/cac-submission-portal-draft.md`
  - The portal requires a public HTTPS video link. The local/GitHub `webm` is useful, but the final submission should use an unlisted YouTube/Vimeo-style URL or another public HTTPS video page.

- **Final coding completion date is still TBD.**
  - Path: `docs/cac-submission-portal-draft.md`
  - Use the final code-freeze date after the demo build and video path are stable.

- **Decide whether the GitHub repo becomes public before submission.**
  - Path: `docs/cac-submission-portal-draft.md`
  - Keep it private until the submission/video is final. Make it public only if/when pursuing Congressional Certification.

## Should Fix

- **Create the final narrated demo video.**
  - Current file: `docs/assets/submission/echo-demo-walkthrough.webm`
  - The silent walkthrough is useful as raw/demo material, but the actual CAC video should use Raphael's voice and a more intentional story.

- **Pick one thumbnail and title.**
  - Recommended title: `Echo - A Private Time Capsule for a Future Self`
  - Recommended thumbnail: `docs/assets/video/echo-thumbnail-02-human-place-time.jpg`

- **Do a final README check after repo visibility changes.**
  - Path: `README.md`
  - Private GitHub links and media references currently work inside the repo. If the repo becomes public, check that every media file renders as intended on GitHub.

## Nice To Have

- **Add a final public app/demo URL if one exists.**
  - The portal has an optional project link field. Use it only if judges can open it without permission problems.

- **Add a final video script next to the portal draft.**
  - Suggested path: `docs/cac-final-video-script.md`
  - This would make recording easier and keep the video aligned with the portal answers.

- **Keep generated media scripts.**
  - `scripts/generate-submission-media.mjs`
  - `scripts/generate-video-thumbnails.mjs`
  - These are worth keeping because they make the screenshot/thumbnail assets reproducible.

## Checks Completed

- `npm run check:js` passed.
- Relative link check passed for `README.md` and current submission docs.
- Submission thumbnails are valid `1280x720` JPEGs.
- Submission screenshot assets are organized under `docs/assets/submission/`.
- Stray `.DS_Store` files were removed locally; `.gitignore` already blocks them.
