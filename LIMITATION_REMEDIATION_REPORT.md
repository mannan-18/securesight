# SecureSight limitation remediation report

Validation date: 12 September 2026.

## 1. Demo mutations and RBAC

**BEFORE:** Demo mutation procedures were public to keep judging friction low.

**ACTION:** Replaced mutation routes with server-enforced tRPC role procedures. Department operations require `DEPARTMENT_ADMIN`; field operations require `DEPARTMENT_ADMIN` or `PMU_INSPECTOR`; evidence verification, risk analysis, and audit verification require `DEPARTMENT_ADMIN` or `AUDITOR`. Institute administrators are scoped to their organization path. Inputs use strict identifier and coordinate validation. Client-provided inspector selection remains ignored.

**AFTER:** Actual `appRouter.createCaller` tests returned `FORBIDDEN` for PMU assignment attempts, returned `FORBIDDEN` for an institute administrator targeting `INS-002` from an `INS-001` account, allowed PMU GPS capture, rejected malformed coordinates, and denied PMU audit verification. The administration test suite also denies role management to non-department users.

**STATUS:** **FIXED FOR MVP RBAC.** Named roles and organization IDs are active in the managed MySQL `users` table. A persisted membership model remains production hardening.

## 2. Process-backed domain state

**BEFORE:** Institutes, inspections, assignments, evidence, attendance, alerts, and audit events were held in process memory.

**ACTION:** Added the Drizzle-managed MySQL `domain_records` table through migration `drizzle/0002_free_titanium_man.sql`. Startup hydration loads persisted records before serving requests. State-changing tRPC procedures and multipart evidence routes perform transactional bulk upserts before returning.

**AFTER:** The managed database contains the domain record envelope. Startup logs report database hydration after restart, with `192` records loaded after persisted workflow activity. Audit previous/current hashes remain intact after hydration, and the audit verification procedure continues to pass.

**STATUS:** **FIXED FOR MVP PERSISTENCE ENVELOPE.** Dedicated normalized tables, foreign keys, and database row locks remain open.

## 3. Evidence storage

**BEFORE:** Evidence capture used demo metadata and `demo://` references.

**ACTION:** Multipart evidence now uses the built-in S3-compatible storage helper. The server validates MIME and size, calculates SHA-256, stores the object key and metadata in MySQL, exposes authorized signed downloads, and provides actual-object re-verification through `/api/evidence/:evidenceId/verify-storage`.

**AFTER:** `scripts/storage-proof.ts` uploaded bytes through a presigned PUT flow, retrieved them through a presigned GET URL, and matched the SHA-256 of the downloaded object. The authenticated HTTP workflow still needs Cloud Test execution with a real session.

**STATUS:** **MOSTLY FIXED FOR MVP.** A full antivirus engine, retention deletion automation, and persisted organization membership checks remain open.

## 4. Offline inspection mode

**BEFORE:** The browser queue used localStorage and stored unencrypted action payloads.

**ACTION:** Replaced the queue with IndexedDB, added queued/syncing/synced/failed states, added service-worker shell caching, and encrypted queued payloads with AES-GCM using PBKDF2-derived key material from the authenticated session or user identity.

**AFTER:** TypeScript validation and production build pass. The mobile web experience remains responsive at the previously verified 375px viewport.

**STATUS:** **PARTIALLY FIXED.** Binary photo capture, background retry/backoff, background sync registration, and server-authoritative reassignment conflict handling still need browser-offline proof.

## 5. CCTV provider

**ACTION:** Retained explicit `CCTVProvider`, `MockCCTVProvider`, and `LiveCCTVProvider` contracts. Mock responses distinguish `ONLINE`, `OFFLINE`, and `INVALID_STREAM` without exposing credentials.

**STATUS:** **PARTIALLY FIXED.** No real RTSP/HLS/WebRTC provider is configured.

## 6. Video-conferencing provider

**ACTION:** Retained explicit `VideoConferenceProvider`, `MockVideoConferenceProvider`, and `LiveVideoConferenceProvider` contracts. Mock sessions are labeled `DEMO` and invalid participants return structured failures.

**STATUS:** **PARTIALLY FIXED.** No real conferencing vendor is configured.

## 7. Validation summary

| Check | Result |
|---|---|
| Confirmed stack | PASS — Express/tRPC/Drizzle/MySQL verified from code and database |
| Drizzle migration generated and reviewed | PASS |
| Managed domain table applied | PASS |
| Startup database hydration after restart | PASS — observed in server logs |
| TypeScript | PASS |
| Production build | PASS after current changes pending final release rerun |
| Automated tests | PASS — 5 files, 17 tests |
| RBAC actual API calls | PASS for tested role boundaries |
| Role administration API | PASS for department-admin authorization test |
| Evidence presigned storage proof | PASS |
| Actual stored-object hash route | Implemented; authenticated Cloud Test proof pending |
| GPS/geofence | PASS for Haversine inside/outside/unavailable and malformed validation |
| Mobile viewport | PASS at previously verified 375px viewport |
| Full offline browser simulation | NOT YET EXECUTED |

## Minimum remaining work before field pilot

Normalize the MySQL persistence envelope into dedicated tables with membership and foreign-key constraints. Add multi-process assignment locking. Complete browser-offline evidence capture and conflict proof. Execute the authenticated Cloud Test evidence workflow. Add antivirus/quarantine, retention automation, backup procedures, and structured monitoring before broad deployment.
