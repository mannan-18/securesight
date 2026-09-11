import { describe, expect, it } from "vitest";
import { alerts, assignments, auditLog, evidence, generateAssignment, getAudit, inspections, reveal, seal, startSurpriseInspection, verifyEvidenceDemo } from "./demoStore";

describe("SecureSight demo workflow", () => {
  it("runs server-controlled surprise inspection assignment lifecycle", () => {
    const inspection = startSurpriseInspection("INS-010");
    expect(inspection.status).toBe("ASSIGNMENT_PENDING");
    const assignment = generateAssignment(inspection.id);
    expect(assignment.inspectorId).toBeTruthy();
    expect(assignment.status).toBe("CREATED");
    expect(() => reveal(assignment.id)).toThrow();
    expect(seal(assignment.id).status).toBe("SEALED");
    expect(reveal(assignment.id).status).toBe("REVEALED");
    expect(inspections.find((item) => item.id === inspection.id)?.status).toBe("ASSIGNED");
  });

  it("preserves the original evidence hash and emits alert plus audit event on tamper", () => {
    const item = evidence.find((entry) => entry.verification === "MATCH");
    if (!item) throw new Error("Expected seeded matching evidence");
    const originalHash = item.originalHash;
    const beforeAlerts = alerts.length;
    const beforeAudit = auditLog.length;
    const result = verifyEvidenceDemo(item.id, true);
    expect(result.result).toBe("TAMPERED");
    expect(result.originalHash).toBe(originalHash);
    expect(alerts.length).toBeGreaterThan(beforeAlerts);
    expect(auditLog.length).toBeGreaterThan(beforeAudit);
    expect(getAudit().verification.valid).toBe(true);
  });

  it("does not allow a duplicate assignment for the same inspection", () => {
    const inspection = startSurpriseInspection("INS-011");
    const assignment = generateAssignment(inspection.id);
    expect(assignments.some((entry) => entry.id === assignment.id && entry.inspectionId === inspection.id)).toBe(true);
    expect(() => generateAssignment(inspection.id)).toThrow();
  });
});
