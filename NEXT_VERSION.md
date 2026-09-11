# SecureSight strongest-next-version upgrade

## Delivered in this pass

SecureSight now includes a persisted named-role migration for the authenticated users table, a migration-ready PostgreSQL/PostGIS domain schema blueprint, an authenticated multipart evidence upload endpoint, scheme-specific inspection checklists, a geographic command view, browser-persisted offline action queue scaffolding, and server-authorized alert acknowledgement/resolution actions.

## Runtime truth

The managed WebDev runtime remains MySQL-backed for its existing OAuth/user scaffold. The role and organization migration was applied to that managed `users` table. The PostgreSQL/PostGIS domain schema is provided at `docs/postgres_postgis_schema.sql` as the next production persistence migration; it is not claimed to be the active runtime until a PostgreSQL connection and migration runner are provisioned.

Multipart uploads currently use a local demo storage provider with a 10 MB limit and allow only JPEG, PNG, and PDF. The endpoint computes SHA-256 on the server and appends an audit event. S3-compatible storage remains the production provider boundary.

The map uses seeded coordinates and clearly labels the demo map. Checklist templates are scheme-specific for NAPDDR, SMILE, and AVYAY. The offline queue persists action intents in browser local storage; a production field build still needs encrypted IndexedDB, background sync, retry state, conflict resolution, and a service worker.

Alert acknowledgement and resolution are now server-authorized Department Admin mutations and append audit events. Production should persist these transitions transactionally in the PostgreSQL alerts/audit tables.

## Recommended next production sequence

1. Provision PostgreSQL with PostGIS and run the provided domain migration.
2. Move domain reads/mutations from the deterministic demo store into Drizzle/PostgreSQL repositories.
3. Replace local evidence storage with configured S3-compatible presigned uploads and malware scanning.
4. Upgrade the browser offline queue to an encrypted IndexedDB outbox with service-worker sync.
5. Add real map tiles/geocoding only after the approved map provider and credentials are configured.
