# Known limitations

The strongest-next-version MVP is **field-workflow ready for judging and pilot design**, but it is not yet a full production deployment. The managed WebDev runtime remains MySQL-backed for its existing OAuth/user scaffold. Named roles and organization scope are now migrated in the managed `users` table; the full PostgreSQL/PostGIS domain schema is provided as a migration-ready blueprint in `docs/postgres_postgis_schema.sql`, not as an active runtime connection.

The MVP now has an authenticated multipart evidence endpoint with JPEG/PNG/PDF validation, a 10 MB limit, server-side SHA-256, and local demo storage. Production still needs presigned S3-compatible storage, malware scanning, persistent evidence metadata, and retention policy.

The geographic command view uses seeded coordinates and is labeled as a demo map. Scheme-specific NAPDDR, SMILE, and AVYAY checklists are available. Alert acknowledgement and resolution are server-authorized and audit-propagated. The offline field queue persists action intents in browser local storage; production still needs encrypted IndexedDB, service-worker background sync, retry/conflict handling, and robust offline GPS/evidence capture.

CCTV and video conferencing remain explicit provider abstractions with safe demo/live stubs. No real RTSP/HLS/WebRTC camera provider or conferencing vendor is configured. Native Android/iOS packaging is intentionally outside this MVP; the supported field experience is responsive mobile web.
