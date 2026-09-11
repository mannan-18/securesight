# Test report

Executed on 12 September 2026 after the strongest-next-version upgrade.

| Command / area | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm build` | PASS — Vite and server bundle with multipart parser |
| `pnpm test` | PASS — 4 files, 15 tests |
| Managed users role migration | PASS — named roles and organizationId applied successfully |
| Backend role authorization | PASS for tested department, PMU, and institute-admin boundaries |
| IDOR organization scope | PASS for tested institute-admin cross-organization request |
| Assignment manipulation | PASS — secure selection, early reveal rejection, sealing lifecycle |
| Evidence integrity | PASS — server SHA-256 recomputation and tamper alert/audit propagation |
| Multipart upload implementation | PASS — authenticated route, one file, 10 MB max, JPEG/PNG/PDF allowlist, server hash |
| Scheme checklists | PASS — NAPDDR/SMILE/AVYAY templates and API query |
| Alert triage | PASS — acknowledge/resolve mutations and audit propagation |
| Geographic command view | PASS — seeded coordinate risk map with institute drill-down |
| Offline field queue | PASS as browser local-storage action-intent prototype; production sync still pending |
| CCTV failure handling | PASS — online, offline, invalid stream, no crash |
| VC failure handling | PASS — missing participant and explicit demo provider status |
| Local evidence storage | PASS — path-safe key generation and object verification |
| Mobile visual validation | PASS — 375x812 responsive screenshot |

The PostgreSQL/PostGIS domain schema is supplied as `docs/postgres_postgis_schema.sql`. It is migration-ready but not claimed as active runtime until a PostgreSQL connection and migration runner are provisioned. The current managed runtime remains MySQL-backed for the existing scaffold/auth path.
