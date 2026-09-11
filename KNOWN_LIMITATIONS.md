# Known limitations

The MVP is **partially ready** for judging rather than production deployment. Domain demo records are held in the backend process for deterministic, low-friction judging; they are not yet persisted as normalized PostgreSQL/PostGIS rows. The scaffold includes managed database auth and storage integration points, but not a production migration for all domain tables.

The UI is demo-accessible. Auth and protected tRPC helpers exist, but demo read/mutation procedures are intentionally public to make the end-to-end flow runnable in a judging preview. Production must wrap domain mutations in role-specific procedures.

CCTV and video conferencing are provider abstractions only. The demo provider does not connect arbitrary RTSP sources or beneficiary devices. File capture is represented as metadata in the demo flow; production must use size-limited multipart upload to S3 with MIME and content checks.
