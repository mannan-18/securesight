# Known limitations

The strongest-next-version MVP is **field-workflow ready for judging and pilot design**, but it is not yet a full production deployment. The committed runtime is Express/tRPC with Drizzle-managed MySQL. Domain records persist through the active `domain_records` JSON envelope, and startup hydration plus a two-phase restart proof have passed. Dedicated normalized domain tables, foreign keys, and multi-process row locks for the full assignment state remain production work; the `assignment_claims` table prevents duplicate assignment creation.

The evidence endpoint uses the built-in S3-compatible storage path with JPEG/PNG/PDF validation, a 10 MB limit, server-side SHA-256, signed downloads, and actual stored-object re-verification code. A full antivirus/quarantine engine, retention policy, and authenticated Cloud Test HTTP proof remain open.

The geographic command view uses seeded coordinates and is labeled as a demo map. Scheme-specific NAPDDR, SMILE, and AVYAY checklists are available. Alert acknowledgement and resolution are server-authorized and audit-propagated. The offline field queue now uses encrypted IndexedDB payloads and a service-worker shell cache, but binary photo capture, background sync, retry/backoff, conflict resolution, and browser network-offline proof remain open.

CCTV and video conferencing remain explicit provider abstractions with safe demo/live stubs. No real RTSP/HLS/WebRTC camera provider or conferencing vendor is configured. Native Android/iOS packaging is intentionally outside this MVP; the supported field experience is responsive mobile web.

Organization scope currently uses a conservative seeded institute-admin rule. Production should replace it with persisted organization memberships and row-level authorization tests across every domain repository. Rate limiting and readiness checks are implemented, but structured monitoring, backup automation, secret rotation, and disaster recovery are still required before broad deployment.
