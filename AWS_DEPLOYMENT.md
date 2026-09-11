# AWS deployment notes

Deploy the Node bundle to a managed container or ECS/Fargate with environment-only secrets. Use RDS PostgreSQL with PostGIS for domain tables, S3 with KMS and short-lived presigned URLs for evidence, CloudWatch structured JSON logs, and IAM roles rather than embedded AWS keys.

Set `SECURESIGHT_JWT_SECRET` to at least 32 random server-only characters. Add an ALB/WAF rate limit for auth, assignment, reveal, upload, and verification routes. Keep the configured OAuth callback exact and never expose server secrets through `VITE_*` variables.
