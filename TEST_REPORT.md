# Test report

Executed on 11 September 2026 in the SecureSight project.

| Command | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm test` | PASS — 2 files, 7 tests |
| `pnpm build` | PASS — Vite and server bundle |

Adversarial cases covered: client-forced inspector ignored; conflict and workload ineligibility; early reveal rejected; sealed assignment cannot be resealed; geofence inside/outside/unavailable; server-side evidence hash match and tamper detection; deliberately broken nested audit payload detected; attendance anomaly scoring separates observed inputs from inferred output.
