import { createHash, randomInt } from "node:crypto";

export type AssignmentStatus = "CREATED" | "SEALED" | "REVEALED" | "COMPLETED";
export type AuditEvent = {
  id: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  createdAt: string;
  previousHash: string | null;
  currentHash: string;
};

const canonicalize = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${canonicalize(nested)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function securePick<T>(items: readonly T[]): T {
  if (!items.length) throw new Error("No eligible candidates");
  return items[randomInt(items.length)];
}

export function chooseEligibleInspector(
  inspectors: Array<{ id: string; name: string; active: boolean; workload: number; conflicts: string[] }>,
  instituteId: string,
) {
  const eligible = inspectors.filter(
    (inspector) => inspector.active && inspector.workload < 4 && !inspector.conflicts.includes(instituteId),
  );
  return securePick(eligible);
}

export function sealAssignment(assignment: { status: AssignmentStatus; inspectorId: string }) {
  if (assignment.status !== "CREATED") throw new Error("Only CREATED assignments can be sealed");
  if (!assignment.inspectorId) throw new Error("Inspector must be selected by the server");
  return { ...assignment, status: "SEALED" as const, sealedAt: new Date().toISOString() };
}

export function revealAssignment(assignment: { status: AssignmentStatus; inspectorId: string }) {
  if (assignment.status !== "SEALED") throw new Error("Assignment can only be revealed after sealing");
  return { ...assignment, status: "REVEALED" as const, revealedAt: new Date().toISOString() };
}

export function geofenceStatus(
  institute: { latitude: number; longitude: number },
  captured: { latitude?: number | null; longitude?: number | null },
  radiusMeters = 100,
): "INSIDE_GEOFENCE" | "OUTSIDE_GEOFENCE" | "LOCATION_UNAVAILABLE" {
  if (captured.latitude == null || captured.longitude == null) return "LOCATION_UNAVAILABLE";
  const earthRadius = 6371000;
  const lat1 = (institute.latitude * Math.PI) / 180;
  const lat2 = (captured.latitude * Math.PI) / 180;
  const deltaLat = ((captured.latitude - institute.latitude) * Math.PI) / 180;
  const deltaLon = ((captured.longitude - institute.longitude) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance <= radiusMeters ? "INSIDE_GEOFENCE" : "OUTSIDE_GEOFENCE";
}

export function verifyEvidence(originalHash: string, candidateContent: string) {
  const recomputedHash = sha256(candidateContent);
  return { recomputedHash, result: recomputedHash === originalHash ? "MATCH" as const : "TAMPERED" as const };
}

export function scoreRisk(signals: {
  geofence: string;
  evidence: string;
  timestamp: string;
  cctvOnline: boolean;
  attendanceAnomaly: number;
}) {
  const factors: string[] = [];
  let score = 8;
  if (signals.geofence === "OUTSIDE_GEOFENCE") { score += 28; factors.push("Outside configured geofence"); }
  if (signals.geofence === "LOCATION_UNAVAILABLE") { score += 7; factors.push("GPS unavailable"); }
  if (signals.evidence === "TAMPERED") { score += 42; factors.push("Evidence hash mismatch"); }
  if (signals.timestamp === "TIMESTAMP_SUSPICIOUS") { score += 12; factors.push("Timestamp plausibility indicator"); }
  if (!signals.cctvOnline) { score += 8; factors.push("CCTV source offline"); }
  if (signals.attendanceAnomaly >= 60) { score += 18; factors.push("Attendance anomaly score elevated"); }
  const bounded = Math.min(100, score);
  return { riskScore: bounded, riskLevel: bounded >= 70 ? "CRITICAL" : bounded >= 45 ? "HIGH" : bounded >= 20 ? "MEDIUM" : "LOW", factors };
}

export function appendAudit(log: AuditEvent[], event: Omit<AuditEvent, "id" | "previousHash" | "currentHash">): AuditEvent {
  const previousHash = log.at(-1)?.currentHash ?? null;
  const base = { ...event, previousHash };
  const currentHash = sha256(`${canonicalize(base)}${previousHash ?? "GENESIS"}`);
  const record = { ...base, id: `AUD-${String(log.length + 1).padStart(4, "0")}`, currentHash };
  log.push(record);
  return record;
}

export function verifyAuditChain(log: AuditEvent[]) {
  let previousHash: string | null = null;
  for (const event of log) {
    const { id: _id, currentHash, ...base } = event;
    const expected = sha256(`${canonicalize({ ...base, previousHash })}${previousHash ?? "GENESIS"}`);
    if (event.previousHash !== previousHash || currentHash !== expected) {
      return { valid: false, brokenEventId: event.id };
    }
    previousHash = currentHash;
  }
  return { valid: true, brokenEventId: null };
}

export function analyzeAttendance(records: Array<{ expected: number; observed: number }>) {
  const total = records.length || 1;
  const deviations = records.map((record) => Math.abs(record.expected - record.observed) / Math.max(record.expected, 1));
  const anomalyScore = Math.round((deviations.reduce((sum, value) => sum + value, 0) / total) * 100);
  return { anomalyScore: Math.min(100, anomalyScore), flaggedDays: deviations.filter((value) => value > 0.2).length };
}
