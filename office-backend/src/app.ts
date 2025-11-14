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
  const keyPath =
    process.env.TLS_KEY_PATH || path.resolve(__dirname, "../../office-add-in/certs/key.pem");
  const certPath =
    process.env.TLS_CERT_PATH || path.resolve(__dirname, "../../office-add-in/certs/cert.pem");
  const caPath = process.env.TLS_CA_PATH;

  const httpsOptions: {
    key: Buffer;
    cert: Buffer;
    ca?: Buffer;
  } = {
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
}

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];

fastify.addHook("onRequest", (request, reply, done) => {
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

fastify.get<{ Params: ZaakParam }>("/zaken/:zaakIdentificatie", (req, res) =>
  zaakController.getZaak(req, res),
);

fastify.post<{ Params: ZaakParam; Body: Record<string, unknown> }>(
  "/zaken/:zaakIdentificatie/documenten",
  (req, res) => zaakController.addDocumentToZaak(req, res),
);

const port = Number(process.env.PORT || 3003);

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
