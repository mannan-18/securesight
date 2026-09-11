# SecureSight

SecureSight is a Smart India Hackathon 2026 MVP for DoSJE project monitoring, surprise inspections, CCTV abstraction, evidence integrity, and anti-fraud intelligence.

## Run

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

The live preview exposes the operations console and typed tRPC API under `/api/trpc`. Swagger/OpenAPI is not included in this Node/tRPC scaffold; the typed router is the contract for this MVP.

## Demo flow

1. Open the command centre and inspect KPI cards, recent inspections, alerts, and readiness posture.
2. Open **Institutes & projects**, choose an institute, and click **Start surprise**.
3. Open **Assignments** and execute generate, seal, reveal, GPS, evidence, submit, and advisory risk analysis.
4. Open **Evidence verification** and use **Tamper & re-verify** to create a server-side hash mismatch, alert, and audit event.
5. Open **Tamper-evident audit** and click **Verify chain**.

The preview is intentionally accessible in demo mode for judging. When Manus OAuth is connected, the scaffolded auth session is available and the server retains protected-procedure support.

## Design boundary

This MVP uses fictional seeded domain records served by the backend process, with managed database-backed auth from the scaffold. Production should move domain persistence to PostgreSQL/PostGIS and S3 before deployment.
