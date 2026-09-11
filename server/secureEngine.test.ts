import { describe, expect, it } from "vitest";
import { analyzeAttendance, appendAudit, chooseEligibleInspector, geofenceStatus, revealAssignment, sealAssignment, sha256, verifyAuditChain, verifyEvidence } from "./secureEngine";

describe("SecureSight security primitives", () => {
  it("does not allow client-forced inspectors and excludes conflicts/workload", () => {
    const inspectors = [
      { id: "forced", name: "Forced", active: true, workload: 0, conflicts: ["INS-001"] },
      { id: "busy", name: "Busy", active: true, workload: 4, conflicts: [] },
      { id: "eligible", name: "Eligible", active: true, workload: 1, conflicts: [] },
    ];
    expect(chooseEligibleInspector(inspectors, "INS-001").id).toBe("eligible");
  });

  it("enforces assignment sealing and prevents early reveal or mutation", () => {
    expect(() => revealAssignment({ status: "CREATED", inspectorId: "INSP-1" })).toThrow();
    const sealed = sealAssignment({ status: "CREATED", inspectorId: "INSP-1" });
    expect(sealed.status).toBe("SEALED");
    expect(() => sealAssignment(sealed)).toThrow();
    expect(revealAssignment(sealed).status).toBe("REVEALED");
  });

  it("returns all geofence states and treats unavailable GPS as unavailable", () => {
    const institute = { latitude: 18.5204, longitude: 73.8567 };
    expect(geofenceStatus(institute, { latitude: null, longitude: null })).toBe("LOCATION_UNAVAILABLE");
    expect(geofenceStatus(institute, { latitude: 18.5204, longitude: 73.8567 })).toBe("INSIDE_GEOFENCE");
    expect(geofenceStatus(institute, { latitude: 18.53, longitude: 73.86 })).toBe("OUTSIDE_GEOFENCE");
  });

  it("recomputes evidence hash server-side and detects tampering", () => {
    const original = sha256("original-file-bytes");
    expect(verifyEvidence(original, "original-file-bytes").result).toBe("MATCH");
    expect(verifyEvidence(original, "changed-file-bytes").result).toBe("TAMPERED");
  });

  it("verifies a valid audit chain and detects deliberately broken links", () => {
    const log = [] as Parameters<typeof appendAudit>[0];
    appendAudit(log, { type: "A", actor: "test", payload: { n: 1 }, createdAt: "2026-01-01T00:00:00.000Z" });
    appendAudit(log, { type: "B", actor: "test", payload: { n: 2 }, createdAt: "2026-01-01T00:01:00.000Z" });
    expect(verifyAuditChain(log).valid).toBe(true);
    log[0].payload.n = 99;
    expect(verifyAuditChain(log)).toMatchObject({ valid: false, brokenEventId: "AUD-0001" });
  });

  it("keeps attendance observed values separate from inferred anomaly scoring", () => {
    const result = analyzeAttendance([{ expected: 100, observed: 100 }, { expected: 100, observed: 50 }]);
    expect(result.anomalyScore).toBe(25);
    expect(result.flaggedDays).toBe(1);
  });
});
