# SecureSight strongest-next-version upgrade

## Delivered in this pass

SecureSight now includes persisted named roles and organizations, a Drizzle-managed MySQL domain record envelope, startup hydration, transactional bulk upserts after workflow mutations, an authenticated multipart evidence upload endpoint, actual stored-object SHA-256 re-verification, signed evidence downloads, scheme-specific checklists, a geographic command view, an encrypted IndexedDB outbox foundation, a service-worker shell cache, server-authorized alert triage, role administration procedures and screen, readiness checks, and API rate limiting.

## Runtime truth

The committed runtime is Express 4 + Node.js + tRPC 11 + Drizzle ORM + managed MySQL. The current geofence implementation is a single application-level Haversine calculation. Object bytes use the built-in S3-compatible storage helper. The project does not use FastAPI, SQLAlchemy, PostgreSQL, PostGIS, or Alembic.

The active `domain_records` table persists institutes, inspectors, inspections, evidence metadata, alerts, assignments, attendance, and audit events as JSON payloads. Startup logs prove database hydration after restart. The table is an MVP persistence envelope rather than a final normalized relational design.

## Remaining production sequence

1. Normalize the JSON persistence envelope into dedicated MySQL tables with foreign keys, memberships, and database row locks around assignment creation.
2. Execute an authenticated Cloud Test flow for upload, signed download, stored-object re-verification, tamper mismatch, and unauthorized-role denial.
3. Complete offline binary photo capture, background retry/backoff, service-worker sync, and server-authoritative conflict resolution.
4. Add a full antivirus or quarantine provider, retention automation, structured monitoring, backup automation, and secret rotation.
5. Replace the conservative seeded institute-scope rule with persisted organization membership authorization.

## Phase 2 hardening status

The real presigned S3-compatible storage proof passed through `scripts/storage-proof.ts`. Multipart evidence now uses that storage path, persists metadata and audit events, and exposes a stored-object re-verification endpoint. The encrypted IndexedDB and service-worker foundations are present. Exact evidence and offline proof gaps are recorded in `PHASE2_HARDENING_REPORT.md`.
