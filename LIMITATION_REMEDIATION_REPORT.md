# SecureSight limitation remediation report

Validation date: 12 September 2026.

## 1. Demo mutations were publicly accessible

**BEFORE:** Demo mutation procedures were public to keep judging friction low.

**ACTION:** Replaced mutation routes with server-enforced tRPC role procedures. Department operations require `DEPARTMENT_ADMIN`; field operations require `DEPARTMENT_ADMIN` or `PMU_INSPECTOR`; evidence verification, risk analysis, and audit verification require `DEPARTMENT_ADMIN` or `AUDITOR`. Institute administrators are organization-scoped for institute operations. Inputs use strict identifier and coordinate validation. Client-provided inspector selection remains ignored.

**AFTER:** Actual `appRouter.createCaller` tests returned `FORBIDDEN` for PMU assignment attempts, returned `FORBIDDEN` for an institute administrator targeting `INS-002` from an `INS-001` account, allowed PMU GPS capture, rejected malformed coordinates, and denied PMU audit verification.

**STATUS:** **PARTIALLY FIXED**. Backend authorization is real and tested, but the scaffold's persisted user role enum currently exposes `admin/user`; production should migrate to the full Department Admin / PMU Inspector / Institute Admin / Auditor role enum.

## 2. Process-backed domain state

**BEFORE:** Institutes, inspections, assignments, evidence, attendance, alerts, and audit events were held in process memory.

**ACTION:** Kept the functioning deterministic demo state and documented the boundary rather than falsely claiming PostgreSQL/PostGIS persistence. The scaffold still has managed database auth and Drizzle integration points.

**AFTER:** `pnpm test` validates the in-process workflow, but no PostgreSQL/PostGIS migration for the critical domain tables was implemented in this remediation pass. Restart persistence for mutations therefore remains unverified and unavailable.

**STATUS:** **INTENTIONALLY MVP-LIMITED**.

## 3. Evidence storage

**BEFORE:** Evidence capture used demo metadata and `demo://` references.

**ACTION:** Added `EvidenceStorageProvider`, `LocalDemoEvidenceStorage`, and an explicit `S3CompatibleEvidenceStorage` stub. Local storage sanitizes basenames and generates safe UUID keys. S3 failure is explicit when credentials/configuration are absent.

**AFTER:** Tests verified safe local storage for a path-traversal filename, object verification, and that the unconfigured production boundary is not silently claimed as live. The evidence hash and metadata flow remains server-side.

**STATUS:** **PARTIALLY FIXED**.

## 4. CCTV provider

**BEFORE:** CCTV was presented as a mock/provider abstraction.

**ACTION:** Added `CCTVProvider`, `MockCCTVProvider`, and `LiveCCTVProvider` contracts. The mock distinguishes `ONLINE`, `OFFLINE`, and `INVALID_STREAM`; provider status does not expose credentials. The dashboard copy explicitly labels demo feeds.

**AFTER:** Tests verified online/offline/invalid-stream responses without application crashes.

**STATUS:** **PARTIALLY FIXED**. A configured real RTSP/HLS/WebRTC provider is not connected.

## 5. Video conferencing provider

**BEFORE:** VC was only a mock/provider abstraction.

**ACTION:** Added `VideoConferenceProvider`, `MockVideoConferenceProvider`, and `LiveVideoConferenceProvider`. The mock returns explicit `DEMO` sessions and `FAILED` for missing participants; production provider failure returns a structured failure rather than crashing.

**AFTER:** Tests verified session creation, participant validation, demo labeling, and failure handling.

**STATUS:** **PARTIALLY FIXED**. No real conferencing vendor is configured.

## 6. Native mobile packaging

**BEFORE:** No native Android/iOS package.

**ACTION:** No native rebuild was attempted because it is explicitly not required for this MVP. The responsive field inspection experience remains the supported delivery format.

**AFTER:** Existing visual verification passed at 375x812 and 1280x720. The mobile web workflow is retained.

**STATUS:** **INTENTIONALLY MVP-LIMITED**.

## Validation summary

| Check | Result |
|---|---|
| TypeScript | PASS |
| Production build | PASS in previous validation; rerun recommended before deployment after remediation |
| Automated tests | PASS — 4 files, 14 tests |
| RBAC actual API calls | PASS for tested role boundaries |
| IDOR organization scope | PASS for tested institute-admin path |
| Assignment manipulation | PASS for secure selection and lifecycle tests |
| Evidence integrity | PASS for server recomputation and tamper alert/audit propagation |
| GPS/geofence | PASS for inside/outside/unavailable and malformed-coordinate validation |
| AI failure behavior | Existing advisory mock path remains; provider failure fallback should receive a dedicated injected-failure test before production |
| CCTV failure | PASS for invalid/offline mock responses |
| VC failure | PASS for missing participant and explicit mock provider failure |
| Mobile viewport | PASS at 375px screenshot validation |

## Minimum remaining work before SIH presentation

The judging demo is ready with materially stronger security boundaries. Before presenting persistence as a production claim, add PostgreSQL/PostGIS migrations for the domain tables, move evidence bytes to configured S3-compatible storage, migrate the role enum to the four named roles, and configure a real CCTV/VC provider only if credentials and compatible endpoints are available. Do not describe the current demo as real S3, real CCTV, real VC, native mobile, or fully PostgreSQL-persistent.
