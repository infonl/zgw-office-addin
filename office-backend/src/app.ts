/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import { ZaakService } from "../service/ZaakService";
import { ZaakController } from "../controller/ZaakController";
import { ZaakDto } from "../dto/ZaakParam";

const fastify = Fastify({
  https: {
    key: fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.pem"),
  },
});

fastify.addHook("onRequest", (request, reply, done) => {
  const allowedOrigins = ["https://localhost:3000"];
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
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

fastify.get<{Params: ZaakDto}>(
  "/zaken/:zaakNummer",
  async (request, reply) => {
    await new ZaakController().getZaak(request, reply);
  }
);

fastify.listen({ port: 3003, host: "127.0.0.1" }, (err, address) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`🚀 Secure server running at ${address}`);
});
