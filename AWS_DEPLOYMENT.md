# AWS deployment notes

Deploy the Node bundle to a managed container or ECS/Fargate with environment-only secrets. Use RDS MySQL for the active Drizzle schema and domain persistence envelope, S3 with KMS and short-lived presigned URLs if the built-in storage provider is replaced, CloudWatch structured JSON logs, and IAM roles rather than embedded AWS keys.

The production image should run the built Express server, not a Vite development server. Set the scaffold-provided `JWT_SECRET`, OAuth variables, `DATABASE_URL`, and built-in storage variables through the secret manager. Never expose server secrets through `VITE_*` variables.

Put the service behind an ALB/WAF. Add edge rate limits for OAuth, assignment, reveal, upload, and verification routes in addition to the application limiter. Configure health checks against `/api/health/ready`, graceful termination, database connection limits, and a rolling deployment strategy.

Before production, replace the JSON domain envelope with normalized MySQL repositories and migrations, enable automated backups and restore drills, add object retention/quarantine, add structured audit export, and validate that assignment claims remain safe across the chosen container concurrency model.
