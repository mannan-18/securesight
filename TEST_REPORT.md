# Test report

Executed on 12 September 2026 in the SecureSight project after limitation remediation.

| Command / area | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm build` | PASS — Vite and server bundle |
| `pnpm test` | PASS — 4 files, 14 tests |
| Backend role authorization | PASS for tested department, PMU, and institute-admin boundaries |
| IDOR organization scope | PASS for tested institute-admin cross-organization request |
| Assignment manipulation | PASS — secure selection, early reveal rejection, sealing lifecycle |
| Evidence integrity | PASS — server SHA-256 recomputation and tamper alert/audit propagation |
| GPS/geofence | PASS — inside, outside, unavailable, malformed coordinate validation |
| CCTV failure handling | PASS — online, offline, invalid stream, no crash |
| VC failure handling | PASS — missing participant and explicit demo provider status |
| Local evidence storage | PASS — path-safe key generation and object verification |
| Mobile visual validation | PASS — previous 375x812 field viewport; login gate is responsive |

Adversarial cases covered: client-forced inspector ignored; conflict and workload ineligibility; early reveal rejected; sealed assignment cannot be resealed; PMU assignment request returns `FORBIDDEN`; institute-admin cross-organization request returns `FORBIDDEN`; PMU audit verification returns `FORBIDDEN`; malformed GPS input rejected; path-traversal filename sanitized; invalid CCTV stream handled; empty VC participant handled; deliberately broken nested audit payload detected.

The test suite uses actual `appRouter.createCaller` calls with authenticated contexts for RBAC and provider-safe behavior. It does not claim PostgreSQL restart persistence because critical domain data remains process-backed in this MVP.
