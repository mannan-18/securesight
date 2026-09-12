import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createHash } from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter, actorRole } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";
import { alerts, auditLog, evidence, flushPersistence, hydrateDemoState, inspections, queuePersistence } from "../demoStore";
import { appendAudit } from "../secureEngine";
import { storagePut, storageGetSignedUrl } from "../storage";
import { getDb, seedDemoAccounts } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const persistence = await hydrateDemoState();
  console.log(`[Persistence] Domain state loaded from ${persistence.source}: ${persistence.count} records`);
  await seedDemoAccounts();
  const app = express();
  const server = createServer(app);
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (limit: number, windowMs: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (bucket.count > limit) return res.status(429).setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000)).json({ error: "Rate limit exceeded" });
    return next();
  };
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health/ready", async (_req, res) => {
    let database = false;
    let storage = false;
    try { const db = await getDb(); if (db) { await db.execute("SELECT 1"); database = true; } } catch { database = false; }
    try { await storageGetSignedUrl("health/probe.txt"); storage = true; } catch { storage = false; }
    const ready = database && storage;
    return res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "degraded", database, storage, timestamp: new Date().toISOString() });
  });
  const evidenceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype)),
  });
  app.post("/api/evidence/upload", evidenceUpload.single("file"), async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const role = actorRole(user);
      if (!["DEPARTMENT_ADMIN", "PMU_INSPECTOR"].includes(role)) return res.status(403).json({ error: "Role not authorized for evidence capture" });
      const inspectionId = String(req.body.inspectionId ?? "");
      const inspection = inspections.find((item) => item.id === inspectionId);
      if (!inspection || !req.file) return res.status(400).json({ error: "inspectionId and supported file are required" });
      const stored = await storagePut(`securesight/${inspectionId}/${req.file.originalname}`, req.file.buffer, req.file.mimetype);
      const item = {
        id: `EVD-${String(evidence.length + 1).padStart(4, "0")}`,
        inspectionId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        originalHash: createHash("sha256").update(req.file.buffer).digest("hex"),
        storageRef: stored.key,
        capturedAt: new Date().toISOString(),
        gpsStatus: "LOCATION_UNAVAILABLE",
        verification: "PENDING" as const,
      };
      evidence.unshift(item);
      inspection.evidenceCount += 1;
      appendAudit(auditLog, { type: "EVIDENCE_MULTIPART_UPLOADED", actor: user.email ?? user.openId, payload: { evidenceId: item.id, inspectionId, fileSize: req.file.size, fileType: item.mimeType }, createdAt: new Date().toISOString() });
      queuePersistence();
      await flushPersistence();
      return res.status(201).json({ evidence: item, metadata: { fileSize: req.file.size, createdBy: user.id, storageMode: "S3_COMPATIBLE_MANUS_STORAGE", downloadUrl: `/api/evidence/${item.id}/download` } });
    } catch (error) {
      return res.status(401).json({ error: error instanceof Error ? error.message : "Upload unauthorized" });
    }
  });
  app.get("/api/evidence/:evidenceId/download", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const role = actorRole(user);
      if (!["DEPARTMENT_ADMIN", "PMU_INSPECTOR", "AUDITOR", "INSTITUTE_ADMIN"].includes(role)) return res.status(403).json({ error: "Role not authorized for evidence download" });
      const item = evidence.find((entry) => entry.id === req.params.evidenceId);
      if (!item) return res.status(404).json({ error: "Evidence not found" });
      const inspection = inspections.find((entry) => entry.id === item.inspectionId);
      if (!inspection) return res.status(404).json({ error: "Evidence inspection not found" });
      if (role === "INSTITUTE_ADMIN" && !user.email?.toLowerCase().includes("ins-001")) return res.status(403).json({ error: "Evidence is outside the user's institute scope" });
      return res.redirect(307, await storageGetSignedUrl(item.storageRef));
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "Evidence download unavailable" });
    }
  });
  app.post("/api/evidence/:evidenceId/verify-storage", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!["DEPARTMENT_ADMIN", "AUDITOR"].includes(actorRole(user))) return res.status(403).json({ error: "Role not authorized for evidence verification" });
      const item = evidence.find((entry) => entry.id === req.params.evidenceId);
      if (!item) return res.status(404).json({ error: "Evidence not found" });
      const signedUrl = await storageGetSignedUrl(item.storageRef);
      const objectResponse = await fetch(signedUrl);
      if (!objectResponse.ok) return res.status(502).json({ error: `Stored object unavailable (${objectResponse.status})` });
      const bytes = Buffer.from(await objectResponse.arrayBuffer());
      const recomputedHash = createHash("sha256").update(bytes).digest("hex");
      item.verification = recomputedHash === item.originalHash ? "MATCH" : "TAMPERED";
      if (item.verification === "TAMPERED") alerts.unshift({ id: `ALT-${1043 + alerts.length}`, type: "TAMPERED_EVIDENCE", severity: "CRITICAL", title: "Stored evidence integrity mismatch", detail: `${item.id} does not match its server hash after object retrieval.`, status: "OPEN", createdAt: new Date().toISOString() });
      appendAudit(auditLog, { type: item.verification === "MATCH" ? "EVIDENCE_STORAGE_VERIFIED" : "EVIDENCE_STORAGE_TAMPER_DETECTED", actor: user.email ?? user.openId, payload: { evidenceId: item.id, recomputedHash, result: item.verification }, createdAt: new Date().toISOString() });
      queuePersistence();
      await flushPersistence();
      return res.json({ evidenceId: item.id, result: item.verification, recomputedHash, bytes: bytes.length });
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "Stored evidence verification unavailable" });
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    rateLimit(120, 60_000),
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
