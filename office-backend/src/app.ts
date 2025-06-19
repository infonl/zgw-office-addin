/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import fs from "fs";
import { ZaakController } from "../controller/ZaakController";
import { ZaakParam } from "../dto/ZaakParam";
import Fastify from "fastify";
import { ZaakService } from "../service/ZaakService";
import { HttpService } from "../service/HttpService";
import { onRequestLoggerHook } from "../hooks/onRequestLoggerHook";
import { LoggerService } from "../service/LoggerService";

const fastify = Fastify({
  https: {
    key: fs.readFileSync(process.env.KEY_PATH!),
    cert: fs.readFileSync(process.env.CERT_PATH!),
    ca: fs.readFileSync(process.env.CA_CERT_PATH!),
  },
});

fastify.addHook("onRequest", (request, reply, done) => {
  const allowedOrigins = ["https://localhost:3000"];
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

fastify.listen({ port: 3003, host: "127.0.0.1" }, (err, address) => {
  if (err) {
    LoggerService.error("Error starting server:", err);
    process.exit(1);
  }
  LoggerService.log(`🚀 Secure server running at ${address}`);
});
