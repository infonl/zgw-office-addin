/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import path from "path";
import { ZaakController } from "../controller/ZaakController";
import { ZaakParam } from "../dto/ZaakParam";
import Fastify, { FastifyInstance } from "fastify";
import { ZaakService } from "../service/ZaakService";
import { HttpService } from "../service/HttpService";
import { onRequestLoggerHook } from "../hooks/onRequestLoggerHook";
import { LoggerService } from "../service/LoggerService";
import fs from "fs";
import { envServerSchema } from "./envSchema";
import { exchangeBootstrapTokenForGraphToken } from "../service/oboService";

let fastify: FastifyInstance;
const isLocal = envServerSchema.APP_ENV === "local";

if (isLocal && envServerSchema.KEY_PATH && envServerSchema.CERT_PATH) {
  const keyPath = path.resolve(__dirname, envServerSchema.KEY_PATH);
  const certPath = path.resolve(__dirname, envServerSchema.CERT_PATH);
  const caPath = envServerSchema.CA_CERT_PATH
    ? path.resolve(__dirname, envServerSchema.CA_CERT_PATH)
    : undefined;
  const httpsOptions: { key: Buffer; cert: Buffer; ca?: Buffer } = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  if (caPath) {
    httpsOptions.ca = fs.readFileSync(caPath);
  }

  fastify = Fastify({ https: httpsOptions });
  LoggerService.log(`[backend] Using TLS key at ${keyPath} and cert at ${certPath}`);
} else {
  fastify = Fastify();
  LoggerService.log(`[backend] Running without TLS (env: ${envServerSchema.APP_ENV})`);
}

const allowedOrigins = envServerSchema.FRONTEND_URL ? [envServerSchema.FRONTEND_URL] : [];

fastify.addHook("onRequest", (request, reply, done) => {
  // Security headers
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS headers
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization, auteur");
    reply.header("Access-Control-Allow-Credentials", "true");
  }

  if (request.method === "OPTIONS") {
    reply.status(200).send();
    return;
  }

  done();
});

fastify.addHook("onRequest", onRequestLoggerHook);

const httpService = new HttpService();
const zaakService = new ZaakService(httpService);
const zaakController = new ZaakController(zaakService);

// Health check endpoint for Kubernetes probes
fastify.get("/health", async (_req, res) => {
  return res
    .status(200)
    .header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    .send({ status: "ok" });
});

fastify.get<{ Params: ZaakParam }>("/zaken/:zaakIdentificatie", (req, res) =>
  zaakController.getZaak(req, res),
);

fastify.post<{ Params: ZaakParam; Body: Record<string, unknown> }>(
  "/zaken/:zaakIdentificatie/documenten",
  (req, res) => zaakController.addDocumentToZaak(req, res),
);

// === OBO AUTH ENDPOINT ===
fastify.post("/auth/obo", async (req, res) => {
  try {
    const body = req.body as any;

    if (!body?.token) {
      return res.status(400).send("Missing bootstrap token");
    }

    const graphToken = await exchangeBootstrapTokenForGraphToken(body.token);

    return res.status(200).send({ access_token: graphToken });
  } catch (err: any) {
    LoggerService.error("❌ /auth/obo error:", err);
    return res.status(500).send(err.message);
  }
});

const port = Number(envServerSchema.PORT || 3003);

fastify.listen(
  {
    port,
    host: "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      LoggerService.error("Error starting server:", err);
      process.exit(1);
    }
    LoggerService.log(`🚀 Server running at ${address}`);
  },
);
