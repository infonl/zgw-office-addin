/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import dotenv from "dotenv";
import path from "path";

import { ZaakController } from "../controller/ZaakController";
import { ZaakParam } from "../dto/ZaakParam";
import Fastify, { FastifyInstance } from "fastify";
import { ZaakService } from "../service/ZaakService";
import { HttpService } from "../service/HttpService";
import { onRequestLoggerHook } from "../hooks/onRequestLoggerHook";
import { LoggerService } from "../service/LoggerService";
import fs from "fs";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let fastify: FastifyInstance;
const isLocal = process.env.APP_ENV === "local";

if (isLocal) {
  fastify = Fastify({
    https: {
      key: fs.readFileSync(path.join(__dirname, process.env.KEY_PATH!)),
      cert: fs.readFileSync(path.join(__dirname, process.env.CERT_PATH!)),
      ca: fs.readFileSync(path.join(__dirname, process.env.CA_CERT_PATH!)),
    },
  });
} else {
  fastify = Fastify();
}

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];

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

fastify.listen({ port: 3003, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    LoggerService.error("Error starting server:", err);
    process.exit(1);
  }
  LoggerService.log(`🚀 Server running at ${address}`);
});
