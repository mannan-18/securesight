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
import { auditLog, evidence, inspections } from "../demoStore";
import { appendAudit } from "../secureEngine";
import { storagePut, storageGetSignedUrl } from "../storage";

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
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
      return res.redirect(307, await storageGetSignedUrl(item.storageRef));
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "Evidence download unavailable" });
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
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
