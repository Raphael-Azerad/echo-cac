# ADR 0001: Local-First Before Cloud Sync

Date: 2026-08-24

## Status

Accepted.

## Context

Echo stores intensely personal letters, voice notes, photos, and future-facing reflections. The product promise depends on users believing sealed content is quiet, private, and not casually exposed.

Convex and Supabase are both strong options for real-time sync, authentication, server functions, and managed persistence. They would help when Echo needs accounts, cross-device restore, sharing, notifications, or collaborative/guardian workflows.

Today, Echo does not need those capabilities to prove the CAC prototype. Adding a backend now would introduce account design, privacy policy scope, secrets, auth flows, remote data handling, and judging-demo fragility before the core product needs them.

## Decision

Do not add Convex or Supabase yet.

Keep Echo local-first with IndexedDB, JSON export, and JSON import. Treat cloud sync as a future adapter behind the storage module, not as a rewrite of the product.

## Consequences

- The prototype remains private by default and easy to run.
- CAC judges can see technical depth through local persistence, media capture, sealed-content privacy, export/import, accessibility tests, and AI-policy evals.
- Cross-device sync is not available yet.
- Future backend work should start with a storage interface and threat model before choosing a provider.

## Revisit When

- Users need cross-device access.
- The app needs scheduled open-date notifications.
- Users need account recovery or encrypted cloud backup.
- We add native mobile packaging or a hosted production deployment.

## Likely Future Choice

Prefer Supabase if Echo needs Postgres, row-level security, auth, storage buckets, and straightforward exportability.

Prefer Convex if Echo needs reactive sync, realtime collaboration, server functions, and a simpler full-stack data model.

For Echo's privacy posture, either choice must support a plan for encryption, least-privilege rules, media storage limits, export/delete, and clear disclosure of what leaves the device.
