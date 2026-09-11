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
