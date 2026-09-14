# AI Usage Disclosure Draft

Echo currently includes a small writing-polish prototype during creation. In this version it runs locally as a privacy-safe interaction prototype and does not call an AI model. If it is later connected to an AI model, it should only process text the user explicitly highlights or submits.

The repository now includes an AI-readiness evaluation scaffold using Promptfoo. This does not call an AI model and does not add AI behavior to the app; it exists so that future AI features have a safety and quality gate before they are introduced.

AI coding tools were used as development assistance for brainstorming, implementation support, research, and review. Any final Congressional App Challenge submission should disclose that AI assisted the development process, while also explaining the student's own product direction, design decisions, testing, and technical understanding.

Suggested submission wording for the current version:

> I used AI coding tools as an assistant while developing Echo, mainly for implementation help, research, debugging, and quality review. I made the product decisions, tested the app, and can explain the architecture and code. Echo includes a small privacy-first writing-polish prototype, but it does not currently send user writing to an AI model.

If Echo later adds AI-powered features, this document must be updated to describe:

- What the AI feature does.
- What model/API is used.
- What user data is sent off-device.
- How privacy, consent, and deletion are handled.
- Why the feature is necessary for Echo's purpose.
