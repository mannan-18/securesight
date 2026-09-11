# Security

The server is authoritative for assignment selection, assignment transitions, evidence hash calculation, geofence classification, and audit-chain verification. The client payload may include a requested inspector in the adversarial demo, but the backend ignores it.

Evidence hashes are recomputed from server-received content. A mismatch preserves the original hash, creates a typed alert, and appends an audit event. Audit events are tamper-evident and hash-chained; they are not described as absolutely immutable.

GPS is a location-based verification signal and missing GPS becomes `LOCATION_UNAVAILABLE`, not fraud. Timestamps are indicators, not proof. AI is advisory only and cannot write assignment, evidence, verification, or audit records directly.

Before production: add rate limiting, strict upload byte/MIME enforcement, S3 object quarantine, PostGIS permissions, secret rotation, audit storage hardening, and per-role row-level access control.
