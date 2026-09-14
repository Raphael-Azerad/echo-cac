# AI Integration Decision

Last reviewed: 2026-07-15

## Decision

Do not add broad runtime AI to Echo yet.

The tools are useful, but the product does not need an AI chat surface. Adding one now would make Echo feel more generic and would conflict with the existing direction: private letter-writing room plus museum/archive of returned selves.

The only approved AI-shaped interaction for now is a tiny writing polish affordance during creation. It must operate on explicitly selected text only. It must never read the full letter by default.

## Tool Decisions

### Vercel AI SDK

Status: Approved for future use, not installed in the app runtime yet.

Use it if Echo later needs model access, streaming, structured extraction, or provider portability. It should be the default runtime layer for any approved AI feature because it avoids one-off API plumbing.

Potential Echo-fit use cases:

- Opt-in polish for selected text only.
- Opt-in reflective prompt suggestions before an Echo is sealed.
- Optional mood/theme extraction from a letter the user explicitly chooses to analyze.
- A demo-only “impact explainer” for CAC that does not touch private Echo data.

Rejected for now:

- Autowriting letters.
- Simulating a past/future self.
- Summarizing sealed Echoes without opening them.

### assistant-ui

Status: Not needed now.

assistant-ui is excellent for AI chat, copilots, and agents. Echo should not become chat-first unless we intentionally design that product direction. Adding it now would make the interface feel like an AI assistant wrapped around memories.

Potential future use:

- A separate opt-in “reflection guide” during creation, if we decide conversation is truly better than static prompts.

Current risk:

- High chance of AI-wrapper feel.
- Heavy mismatch with the quiet, sealed, museum-like experience.

### Promptfoo

Status: Incorporated as an eval scaffold.

Promptfoo belongs in Echo because it helps prove that any future AI behavior is tested against the product’s values. The first eval uses Promptfoo’s offline `echo` provider, so it validates prompt/policy templates without calling a model or sending user data anywhere.

Future evals should test:

- Selected-text-only boundaries for any writing polish feature.
- No sealed-content leakage.
- No fabricated memories.
- No therapy/medical/legal claims.
- No generic motivational slop.
- No chatbot-first language.
- Clear consent before any data leaves device.

## AI Feature Admission Gate

An AI feature can only enter Echo if all answers are yes:

- Does it make Echo more emotionally meaningful without replacing the user’s own voice?
- Can it work opt-in?
- Can it operate on selected text or explicitly provided input instead of the full letter?
- Can it avoid sealed content by default?
- Can the user understand what data is sent where?
- Can we test it with Promptfoo?
- Can it be removed without breaking the core product?

If any answer is no, do not build it.
