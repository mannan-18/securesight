# API documentation

The typed tRPC contract is exported from `server/routers.ts`.

| Procedure | Purpose |
|---|---|
| `dashboard.overview` | KPIs, trend, recent inspections, recent alerts, CCTV health |
| `dashboard.institutes` | Institute/project list with coordinates, scheme, risk, CCTV state |
| `dashboard.inspections` | Inspection queue and state-machine records |
| `dashboard.assignments` | Assignment lifecycle records |
| `dashboard.evidence` | Evidence metadata and verification status |
| `dashboard.attendance` | Observed attendance and inferred anomaly summaries |
| `dashboard.alerts` | Typed alert records and statuses |
| `dashboard.audit` | Audit events plus chain verification result |
| `workflow.startInspection` | Creates `ASSIGNMENT_PENDING` inspection |
| `workflow.generateAssignment` | Securely chooses eligible inspector; client request is ignored |
| `workflow.sealAssignment` | Seals an unsealed assignment |
| `workflow.revealAssignment` | Reveals only a sealed assignment |
| `workflow.captureGps` | Returns inside/outside/unavailable geofence signal |
| `workflow.captureEvidence` | Creates evidence metadata and server hash |
| `workflow.verifyEvidence` | Recomputes hash, returning `MATCH` or `TAMPERED` |
| `workflow.submitInspection` | Moves inspection to submitted |
| `workflow.analyzeRisk` | Runs advisory MockAIProvider-style risk analysis |
| `workflow.verifyAudit` | Verifies the current hash chain |

## Extended routes

| Procedure or endpoint | Access | Purpose |
|---|---|---|
| `dashboard.checklist` | Authenticated | Returns the scheme-specific checklist for an inspection. |
| `workflow.acknowledgeAlert` | Department Admin | Moves an open alert to acknowledged and appends an audit event. |
| `workflow.resolveAlert` | Department Admin | Resolves an alert and appends an audit event. |
| `POST /api/evidence/upload` | Department Admin / PMU Inspector | Authenticated multipart upload with one JPEG, PNG, or PDF up to 10 MB; server computes SHA-256 and records metadata. |
| `GET /api/evidence/:evidenceId/download` | Authenticated operational role | Returns a short-lived signed object redirect after role and institute-scope checks. |
| `POST /api/evidence/:evidenceId/verify-storage` | Department Admin / Auditor | Retrieves the stored object, recomputes SHA-256, and creates a critical alert on mismatch. |
| `administration.users` | Department Admin | Lists authenticated users and persisted organization scope. |
| `administration.updateUser` | Department Admin | Updates one user's named role and organization scope. |
| `administration.inviteUser` | Department Admin | Creates or updates an invited role identity in the managed users table. |
| `administration.permissionMatrix` | Department Admin | Returns the server-owned role capability matrix. |
| `providers.cctvStatus` | Authenticated | Returns explicit demo/configured CCTV status including invalid-stream handling. |

`GET /api/health/ready` reports managed MySQL and object-storage readiness without exposing secrets. The geographic command view is driven by seeded coordinate records and labeled as a demo map. The browser field queue is an encrypted IndexedDB outbox with a service-worker shell cache; full background sync and conflict resolution remain production work.
