import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { alerts, assignments, evidence, generateAssignment, getAttendanceSummary, getAudit, getOverview, institutes, inspections, reveal, runRiskAnalysis, seal, startSurpriseInspection, captureGps, submitInspection, verifyEvidenceDemo, seedNewEvidence } from "./demoStore";
import { verifyAuditChain } from "./secureEngine";

const demoProcedure = publicProcedure;
const roleGate = (role: string | undefined) => role === "admin" || role === "user";

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
    overview: demoProcedure.query(() => getOverview()),
    institutes: demoProcedure.query(() => institutes),
    inspections: demoProcedure.query(() => inspections),
    alerts: demoProcedure.query(() => alerts),
    assignments: demoProcedure.query(() => assignments),
    evidence: demoProcedure.query(() => evidence.slice(0, 36)),
    attendance: demoProcedure.query(() => getAttendanceSummary()),
    audit: demoProcedure.query(() => getAudit()),
  }),
  workflow: router({
    startInspection: demoProcedure.input(z.object({ instituteId: z.string().min(1) })).mutation(({ input }) => startSurpriseInspection(input.instituteId)),
    generateAssignment: demoProcedure.input(z.object({ inspectionId: z.string().min(1), requestedInspectorId: z.string().optional() })).mutation(({ input }) => {
      // requestedInspectorId is deliberately ignored. Inspector selection is always server-side.
      return generateAssignment(input.inspectionId);
    }),
    sealAssignment: demoProcedure.input(z.object({ assignmentId: z.string().min(1) })).mutation(({ input }) => seal(input.assignmentId)),
    revealAssignment: demoProcedure.input(z.object({ assignmentId: z.string().min(1) })).mutation(({ input }) => reveal(input.assignmentId)),
    captureGps: demoProcedure.input(z.object({ inspectionId: z.string().min(1), latitude: z.number().nullable(), longitude: z.number().nullable() })).mutation(({ input }) => captureGps(input.inspectionId, input.latitude, input.longitude)),
    captureEvidence: demoProcedure.input(z.object({ inspectionId: z.string().min(1) })).mutation(({ input }) => seedNewEvidence(input.inspectionId)),
    submitInspection: demoProcedure.input(z.object({ inspectionId: z.string().min(1), observation: z.string().min(3).max(1000) })).mutation(({ input }) => submitInspection(input.inspectionId, input.observation)),
    verifyEvidence: demoProcedure.input(z.object({ evidenceId: z.string().min(1), tamper: z.boolean().default(false) })).mutation(({ input }) => verifyEvidenceDemo(input.evidenceId, input.tamper)),
    analyzeRisk: demoProcedure.input(z.object({ inspectionId: z.string().min(1) })).mutation(({ input }) => runRiskAnalysis(input.inspectionId)),
    verifyAudit: demoProcedure.mutation(() => verifyAuditChain((getAudit().events))),
  }),
  security: router({
    whoCanMutate: protectedProcedure.query(({ ctx }) => ({ role: ctx.user.role, serverAuthoritative: roleGate(ctx.user.role), note: "Frontend route guards are cosmetic; protected procedures enforce server access." })),
  }),
});

export type AppRouter = typeof appRouter;
