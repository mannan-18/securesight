# SecureSight hardening report

Date: 12 September 2026.

## Confirmed stack

The active project is Express 4 + Node.js + tRPC 11 + Drizzle ORM + managed MySQL. Evidence bytes use the built-in S3-compatible object storage helper. Geofencing uses application-level Haversine distance in `server/secureEngine.ts`. The project does not use FastAPI, SQLAlchemy, PostgreSQL, PostGIS, or Alembic.

## MILESTONE: Drizzle-managed MySQL domain persistence

**STATUS: PASS FOR MVP PERSISTENCE ENVELOPE; PARTIAL FOR NORMALIZED PRODUCTION SCHEMA**

**PROOF EXECUTED:** Generated and reviewed Drizzle migrations `drizzle/0002_free_titanium_man.sql` and `drizzle/0003_married_virginia_dare.sql`, applied the non-destructive `domain_records` and `assignment_claims` tables to managed MySQL, wrote an `INSP-0002` / `ASN-0003` fixture with `scripts/persistence-proof.ts write`, restarted the server, and read it from a fresh process with `scripts/persistence-proof.ts read INSP-0002 ASN-0003`. Result: `ok: true`, `source: database`, persisted inspection and assignment found, audit chain `{ valid: true, brokenEventId: null }`. Startup logs also reported `Domain state loaded from database: 197 records` before the server began listening.

**IMPLEMENTED:** Institutes, inspectors, inspections, assignments, evidence metadata, alerts, attendance, and audit events are serialized into the Drizzle-managed MySQL `domain_records` table. Startup hydration occurs before request serving. Mutating workflow procedures enqueue an atomic transactional snapshot replacement. The `assignment_claims` primary key provides a database-backed single-claim guard for an inspection across concurrent server processes.

**REGRESSIONS CHECKED:** `pnpm check` passed. The full Vitest suite passed with 6 files and 19 tests, including the persistence hydration and assignment uniqueness tests.

**KNOWN GAPS:** The MVP uses a JSON persistence envelope rather than dedicated normalized tables with foreign keys. Assignment state itself is still held in the hydrated typed cache, with the claim table preventing duplicate creation. Risk analyses and VC sessions are currently represented by workflow/provider boundaries rather than separate normalized repositories.

## MILESTONE: S3-compatible evidence storage

**STATUS: PARTIAL — STORAGE AND SERVER RE-VERIFICATION IMPLEMENTED; END-TO-END AUTHENTICATED CLOUD PROOF PENDING**

**PROOF EXECUTED:** Ran `pnpm exec tsx scripts/storage-proof.ts`. The script uploaded bytes through the built-in presigned PUT flow, retrieved the object through a presigned GET URL, re-read the actual object bytes, and compared SHA-256 hashes. Result: `ok: true`, `bytes: 32`, `presigned: true`, hash `851cc89b540981349c1531f5f109785244bca8c7b076102e63e4b966aa996be0`.

**IMPLEMENTED:** Multipart upload validates one file, 10 MB maximum, JPEG/PNG/PDF allowlist, computes server SHA-256, writes bytes through S3-compatible storage, persists evidence metadata and the audit event to MySQL, and exposes an authenticated signed-download route. The new `/api/evidence/:evidenceId/verify-storage` route retrieves the actual stored object, recomputes SHA-256, updates verification status, creates a critical alert on mismatch, and persists the result.

**REGRESSIONS CHECKED:** TypeScript, build, and the full Vitest suite passed after the storage and persistence changes.

**KNOWN GAPS:** MIME and size checks are basic validation, not a full antivirus engine. The authenticated HTTP upload/download proof still needs to be executed with Cloud Test credentials. Institute ownership authorization is currently a conservative seeded email-scope rule and should be replaced by persisted membership rows.

## MILESTONE: Offline inspection mode

**STATUS: PARTIAL — ENCRYPTED INDEXEDDB FOUNDATION IMPLEMENTED**

**IMPLEMENTED:** The field console writes offline action payloads to IndexedDB instead of localStorage. Queued, syncing, synced, and failed states are supported. The service worker caches the application shell and provides an offline navigation fallback. Payloads are encrypted with AES-GCM using a key derived through PBKDF2 from authenticated session material or the authenticated user identity. The queue API includes retry iteration and visible queue state.

**PROOF EXECUTED:** TypeScript validation and production build passed. Responsive mobile preview was previously verified at 375x812. A full browser network-offline simulation with photo capture and forced reassignment conflict was not executed in this sandbox turn.

**KNOWN GAPS:** Binary photo capture, background sync registration, exponential backoff scheduling, and a server-authoritative conflict endpoint are not complete. This milestone remains partial.

## Overall conclusion

SecureSight now has restart-safe MVP persistence on the committed MySQL/Drizzle stack, a database-backed assignment claim guard, proven presigned object storage, actual stored-object hash re-verification code, protected role administration procedures, encrypted IndexedDB queue foundations, service-worker support, and readiness/rate-limit controls. It is a credible judging and controlled-pilot MVP. It is not yet a full production deployment because normalized relational repositories, complete offline sync/conflict handling, full authenticated Cloud Test evidence proof, antivirus scanning, and operational automation remain open.
