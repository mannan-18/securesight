import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { alerts, assignments, evidence, generateAssignment, getAttendanceSummary, getAudit, getChecklistForInspection, getOverview, institutes, inspections, reveal, runRiskAnalysis, seal, startSurpriseInspection, captureGps, submitInspection, updateAlertStatus, verifyEvidenceDemo, seedNewEvidence } from "./demoStore";
import { verifyAuditChain } from "./secureEngine";
import { MockCCTVProvider, MockVideoConferenceProvider } from "./providers";
import type { User } from "../drizzle/schema";

export type ActorRole = "DEPARTMENT_ADMIN" | "PMU_INSPECTOR" | "INSTITUTE_ADMIN" | "AUDITOR";

export function actorRole(user: User): ActorRole {
  if (user.role === "admin" || user.role === "DEPARTMENT_ADMIN") return "DEPARTMENT_ADMIN";
  if (user.role === "PMU_INSPECTOR") return "PMU_INSPECTOR";
  if (user.role === "INSTITUTE_ADMIN") return "INSTITUTE_ADMIN";
  if (user.role === "AUDITOR") return "AUDITOR";
  const email = user.email?.toLowerCase() ?? "";
  if (email.includes("auditor")) return "AUDITOR";
  if (email.includes("institute")) return "INSTITUTE_ADMIN";
  return "PMU_INSPECTOR";
}

function roleProcedure(...allowed: ActorRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    const role = actorRole(ctx.user);
    if (!allowed.includes(role)) throw new TRPCError({ code: "FORBIDDEN", message: `Role ${role} is not authorized for this operation` });
    return next({ ctx: { ...ctx, actorRole: role } });
  });
}

function assertInstituteScope(role: ActorRole, email: string | null, instituteId: string) {
  if (role === "INSTITUTE_ADMIN" && email?.toLowerCase().includes("ins-001") === false) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Institute administrator cannot access another organization's records" });
  }
  if (role === "INSTITUTE_ADMIN" && instituteId !== "INS-001") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Institute administrator cannot access another organization's records" });
  }
}

const readProcedure = protectedProcedure;
const departmentProcedure = roleProcedure("DEPARTMENT_ADMIN");
const fieldProcedure = roleProcedure("DEPARTMENT_ADMIN", "PMU_INSPECTOR");
const verificationProcedure = roleProcedure("DEPARTMENT_ADMIN", "AUDITOR");
const cctv = new MockCCTVProvider();
const vc = new MockVideoConferenceProvider();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    overview: readProcedure.query(() => getOverview()),
    institutes: readProcedure.query(() => institutes),
    inspections: readProcedure.query(() => inspections),
    alerts: readProcedure.query(() => alerts),
    assignments: readProcedure.query(() => assignments),
    evidence: readProcedure.query(() => evidence.slice(0, 36)),
    attendance: readProcedure.query(() => getAttendanceSummary()),
    checklist: readProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/) })).query(({ input }) => getChecklistForInspection(input.inspectionId)),
    audit: verificationProcedure.query(() => getAudit()),
  }),
  workflow: router({
    startInspection: departmentProcedure.input(z.object({ instituteId: z.string().regex(/^INS-\d{3}$/) })).mutation(({ ctx, input }) => { assertInstituteScope(ctx.actorRole, ctx.user.email, input.instituteId); return startSurpriseInspection(input.instituteId); }),
    generateAssignment: departmentProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/), requestedInspectorId: z.string().optional() })).mutation(({ input }) => generateAssignment(input.inspectionId)),
    sealAssignment: departmentProcedure.input(z.object({ assignmentId: z.string().regex(/^ASN-\d{4,}$/) })).mutation(({ input }) => seal(input.assignmentId)),
    revealAssignment: departmentProcedure.input(z.object({ assignmentId: z.string().regex(/^ASN-\d{4,}$/) })).mutation(({ input }) => reveal(input.assignmentId)),
    captureGps: fieldProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/), latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable() })).mutation(({ input }) => captureGps(input.inspectionId, input.latitude, input.longitude)),
    captureEvidence: fieldProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/) })).mutation(({ input }) => seedNewEvidence(input.inspectionId)),
    submitInspection: fieldProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/), observation: z.string().trim().min(3).max(1000) })).mutation(({ input }) => submitInspection(input.inspectionId, input.observation)),
    verifyEvidence: verificationProcedure.input(z.object({ evidenceId: z.string().regex(/^EVD-\d{4,}$/), tamper: z.boolean().default(false) })).mutation(({ input }) => verifyEvidenceDemo(input.evidenceId, input.tamper)),
    analyzeRisk: verificationProcedure.input(z.object({ inspectionId: z.string().regex(/^INSP-\d{4,}$/) })).mutation(({ input }) => runRiskAnalysis(input.inspectionId)),
    verifyAudit: verificationProcedure.mutation(() => verifyAuditChain(getAudit().events)),
    createVideoSession: fieldProcedure.input(z.object({ participantId: z.string().trim().min(1).max(120) })).mutation(({ input }) => vc.createSession(input)),
    acknowledgeAlert: departmentProcedure.input(z.object({ alertId: z.string().regex(/^ALT-\d{4,}$/) })).mutation(({ input }) => updateAlertStatus(input.alertId, "ACKNOWLEDGED")),
    resolveAlert: departmentProcedure.input(z.object({ alertId: z.string().regex(/^ALT-\d{4,}$/) })).mutation(({ input }) => updateAlertStatus(input.alertId, "RESOLVED")),
  }),
  providers: router({
    cctvStatus: readProcedure.input(z.object({ cameraId: z.string().min(1).max(120), streamUrl: z.string().max(500).optional() })).query(({ input }) => cctv.getStatus(input.cameraId, input.streamUrl)),
  }),
  security: router({
    whoAmI: readProcedure.query(({ ctx }) => ({ role: actorRole(ctx.user), serverAuthoritative: true })),
  }),
});

export type AppRouter = typeof appRouter;
