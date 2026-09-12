# SecureSight MVP delivery checklist

## Complete for this MVP

- [x] Reconcile the committed runtime with Express, tRPC, Drizzle, and managed MySQL.
- [x] Apply the `domain_records` migration and persist core domain snapshots.
- [x] Hydrate domain state from MySQL before serving requests.
- [x] Add the `assignment_claims` table and database-backed duplicate-assignment guard.
- [x] Add named roles, organization IDs, seeded role identities, and Department Admin role administration.
- [x] Add S3-compatible multipart evidence upload, signed download, and stored-object SHA-256 re-verification.
- [x] Add encrypted IndexedDB offline queue and service-worker shell cache foundation.
- [x] Add readiness endpoint and application API rate limiting.
- [x] Fix external WebDev Vite HMR websocket configuration.
- [x] Pass TypeScript, production build, 19 Vitest tests, readiness proof, restart persistence proof, and desktop/mobile screenshot review.
- [x] Update stack, security, API, Cloud Test, limitation, judge Q&A, and deployment documentation.

## Deferred / future production hardening — not required to call this MVP complete

- [ ] Normalize `domain_records` into dedicated MySQL tables with foreign keys and membership tables.
- [ ] Lock and persist the full assignment state with multi-process row-level transactions.
- [ ] Complete binary offline photo capture, background sync/backoff, and conflict resolution proof.
- [ ] Execute authenticated Cloud Test HTTP proof for upload, signed download, tamper mismatch, and unauthorized role denial.
- [ ] Add antivirus/quarantine, retention automation, structured monitoring, backup/restore drills, and secret rotation.
- [ ] Replace seeded institute-scope checks with persisted organization membership authorization.
- [ ] Configure real CCTV and video-conference providers after approved credentials/endpoints exist.

These deferred items are explicitly described in `KNOWN_LIMITATIONS.md`, `PHASE2_HARDENING_REPORT.md`, and `AWS_DEPLOYMENT.md`; the MVP does not present them as completed production capabilities.
