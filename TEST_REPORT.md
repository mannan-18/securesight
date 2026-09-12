# SecureSight test report

Executed on 12 September 2026 after the MySQL persistence, assignment-claim, evidence re-verification, role administration, readiness, and encrypted offline queue changes.

| Command / area | Result |
|---|---|
| `pnpm check` | PASS — TypeScript compiles without errors |
| `pnpm test` | PASS — 6 files, 19 tests |
| `pnpm build` | PASS — Vite client and Node server bundle |
| Managed `users` role migration | PASS — named roles and `organizationId` applied |
| Managed `domain_records` migration | PASS — applied to MySQL |
| Managed `assignment_claims` migration | PASS — applied to MySQL |
| Restart persistence proof | PASS — `INSP-0002` and `ASN-0003` loaded from a fresh process; audit chain valid |
| Backend role authorization | PASS for department, PMU, institute-admin, and auditor boundaries tested |
| Role administration API and UI | PASS — only Department Admin can list/change access |
| IDOR organization scope | PASS for tested institute-admin cross-organization request |
| Assignment manipulation | PASS — secure selection, database claim guard, early reveal rejection, sealing lifecycle |
| Evidence integrity | PASS — server SHA-256 recomputation, stored-object re-verification route, tamper alert/audit propagation |
| Multipart upload implementation | PASS — authenticated route, one file, 10 MB max, JPEG/PNG/PDF allowlist, server hash, MySQL metadata |
| Presigned storage proof | PASS — upload/download/hash round trip through built-in S3-compatible storage |
| Scheme checklists | PASS — NAPDDR/SMILE/AVYAY templates and API query |
| Alert triage | PASS — acknowledge/resolve mutations and audit propagation |
| Geographic command view | PASS — seeded coordinate risk map with institute drill-down |
| Offline field queue | PASS as encrypted IndexedDB foundation; full browser offline/sync/conflict simulation pending |
| CCTV failure handling | PASS — online, offline, invalid stream, no crash |
| VC failure handling | PASS — missing participant and explicit demo provider status |
| Readiness endpoint | PASS — local response reported `status: ready`, `database: true`, `storage: true` |
| API rate limit | IMPLEMENTED — 120 requests per minute per IP/path for `/api/trpc` |
| Mobile visual validation | PASS — previously verified at 375x812 responsive viewport |

The test evidence distinguishes MVP proof from production claims. Dedicated normalized MySQL repositories, multi-process row-locked assignment state, antivirus/quarantine, background offline sync, authenticated Cloud Test HTTP evidence, and operational backup/monitoring remain open.
