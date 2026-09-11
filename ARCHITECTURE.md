# Architecture

SecureSight is a modular monolith: React 19 + TypeScript + Vite + Tailwind on the client, Express/tRPC on the server, Drizzle-backed managed database auth, and provider abstractions for CCTV, video conferencing, and AI.

The domain workflow is server-authoritative. `server/demoStore.ts` models institutes, inspectors, inspections, evidence, alerts, attendance, assignments, and audit events for the live MVP preview. `server/secureEngine.ts` contains secure randomness, conflict/workload filters, SHA-256 evidence verification, Haversine geofencing, risk aggregation, and recursive canonical audit hashing.

The next persistence step is mapping these domain collections to PostgreSQL/PostGIS tables and object storage references. The current runtime intentionally avoids claiming production PostGIS or arbitrary RTSP compatibility.
