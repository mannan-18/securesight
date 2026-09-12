# Judge Q&A

1. **What is SecureSight?** A centralized inspection and monitoring control plane for DoSJE schemes.
2. **What is the core differentiator?** A secure random assignment lifecycle plus evidence integrity and a tamper-evident audit trail.
3. **Can an inspector be forced by the client?** No. The server filters eligibility and ignores client-selected inspector input.
4. **Can a sealed assignment be changed?** No. The state machine rejects repeat sealing and early reveal.
5. **Does GPS prove presence?** No. GPS provides a location-based verification signal.
6. **Is the audit log truly immutable?** No. It is tamper-evident and hash-chained; verification detects broken links.
7. **Does AI guarantee fraud prevention?** No. AI identifies risk indicators and anomalies and remains advisory.
8. **Can any CCTV feed connect?** No. CCTV integration is an abstraction for configured compatible streams/providers.
9. **Does the VC automatically connect beneficiaries?** No. Random VC session initiation requires a configured provider.
10. **How is evidence verified?** The server computes SHA-256 on upload and can retrieve the stored object through a signed URL to recompute SHA-256 again.
11. **What happens on mismatch?** The original hash is preserved, a critical alert is opened, and a tamper audit event is appended.
12. **What does missing GPS mean?** `LOCATION_UNAVAILABLE`; it is not automatically fraud.
13. **Why is attendance separate?** Observed register values and inferred anomaly outputs remain distinct.
14. **What roles are supported?** `DEPARTMENT_ADMIN`, `PMU_INSPECTOR`, `INSTITUTE_ADMIN`, and `AUDITOR` are enforced in protected procedures. The legacy `admin` value maps to Department Admin for compatibility.
15. **How does persistence work?** Institutes, inspections, assignments, evidence metadata, alerts, attendance, and audit events are stored in the Drizzle-managed MySQL `domain_records` table and hydrated on restart.
16. **Is there a real backend?** Yes. The console calls typed server procedures and mutates server state through Express and tRPC.
17. **Is this a mobile app?** The inspection view is responsive and designed for 360–412px field use; native packaging is a later step.
18. **What is tested?** Auth logout, role administration, assignment security, transitions, geofence, hash verification, audit integrity, attendance analytics, provider failure behavior, and persistence startup hydration.
19. **How is failure handled?** Provider and AI concepts degrade to explicit demo/mock responses and show operational status rather than crashing the UI.
20. **What should be productionized first?** Normalize the MySQL persistence envelope, add multi-process assignment locking, complete encrypted offline synchronization, add S3 quarantine and retention, and run the authenticated Cloud Test evidence proof.
