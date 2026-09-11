# Known limitations

The MVP remains **partially ready** for judging rather than production deployment. Domain demo records are held in the backend process for deterministic, low-friction judging; they are not yet persisted as normalized PostgreSQL/PostGIS rows. The scaffold includes managed database auth and storage integration points, but not a production migration for all domain tables.

Server-side RBAC is now enforced on the actual tRPC mutations. Department operations, field operations, verification, and audit access are separated by backend role procedures, with an organization-scope check for institute-admin requests. The current scaffold user enum still exposes `admin/user`; production should migrate to the full named role enum.

Evidence now has a clean `EvidenceStorageProvider` abstraction with local demo storage and an explicit unconfigured S3-compatible provider. S3 is not claimed as live. CCTV and video conferencing have explicit provider interfaces and failure-safe mock/live stubs; no arbitrary RTSP stream or real conferencing vendor is connected. Native Android/iOS packaging is intentionally outside this MVP; the supported field experience is responsive mobile web.
