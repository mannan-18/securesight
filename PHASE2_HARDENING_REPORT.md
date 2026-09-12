# SecureSight Phase 2 field-deployment hardening report

Date: 12 September 2026.

## MILESTONE: PostgreSQL/PostGIS domain persistence

**STATUS: PARTIAL / BLOCKED BY RUNTIME MISMATCH**

**PROOF EXECUTED:** Inspected the live project runtime and managed database. `DATABASE_URL` is configured, but the project is a Node/Express + Drizzle/MySQL runtime. The managed database contains only `users` and `__drizzle_migrations`; there is no PostgreSQL/PostGIS server and no Alembic runtime. The existing `docs/postgres_postgis_schema.sql` remains a migration-ready design artifact, not an applied migration. A restart-proof for domain entities cannot honestly pass because the current domain store is still process-backed.

**REGRESSIONS CHECKED:** `pnpm check` passed; existing demo security tests passed; the build remains the existing React/Express runtime.

**KNOWN GAPS:** Institutes, inspections, assignments, evidence metadata, alerts, risk analyses, attendance, CCTV configuration, and audit rows are not yet persisted as PostgreSQL/PostGIS rows. The next implementation requires a PostgreSQL deployment/connection and a deliberate repository migration, or an approved MySQL-compatible persistence design for this WebDev runtime. This milestone is not marked PASS.

## MILESTONE: S3-compatible evidence storage

**STATUS: PARTIAL — STORAGE PROOF PASS, DOMAIN-METADATA PERSISTENCE PENDING**

**PROOF EXECUTED:** Ran `pnpm exec tsx scripts/storage-proof.ts`. The script uploaded bytes through the built-in presigned PUT flow, retrieved the object through a presigned GET URL, re-read the actual object bytes, and compared SHA-256 hashes. Result: `ok: true`, `bytes: 32`, `presigned: true`, hash `851cc89b540981349c1531f5f109785244bca8c7b076102e63e4b966aa996be0`.

**IMPLEMENTED:** Multipart upload validates one file, 10 MB maximum, JPEG/PNG/PDF allowlist, computes server SHA-256, writes bytes through the built-in S3-compatible Manus storage helper, and exposes an authenticated signed-download route. Raw file bytes are no longer stored in the local demo provider for the multipart endpoint.

**REGRESSIONS CHECKED:** TypeScript and all existing Vitest tests passed after the storage change.

**KNOWN GAPS:** Evidence metadata is still held in the process-backed demo store. Malware checking is limited to MIME/size validation and is not an antivirus engine. Download authorization currently uses role-level checks; institute ownership scoping must be connected to persisted organization records in Milestone 1.

## MILESTONE: Real offline inspection mode

**STATUS: PARTIAL**

**PROOF EXECUTED:** Added an IndexedDB outbox implementation with queued/syncing/synced/failed states, a service worker shell cache, offline navigation fallback, and field checklist payload capture. TypeScript validation and production build passed. Responsive mobile preview was previously verified at 375x812.

**IMPLEMENTED:** The field console now writes offline action intents to IndexedDB rather than localStorage. The service worker caches the application shell and falls back to `/index.html` for offline navigation. The UI shows the queued action count and an explicit offline-save action.

**KNOWN GAPS:** A full offline proof using browser network-offline simulation was not executed in this sandbox turn. Binary photo capture, encrypted-at-rest IndexedDB, background sync registration, exponential retry scheduling, and server-authoritative conflict resolution are not complete. The current offline implementation is therefore a meaningful prototype, not a PASS for the directive's full requirement.

## Overall conclusion

SecureSight is materially hardened beyond the judging MVP: real presigned S3-compatible object storage and a real IndexedDB/service-worker foundation are now present. The directive's first milestone remains the gating item. Because this WebDev project is provisioned with MySQL/Drizzle rather than PostgreSQL/PostGIS/Alembic, it is not honest to claim field-deployment completion until the persistence target is provisioned and the domain repositories are migrated and restart-tested.
