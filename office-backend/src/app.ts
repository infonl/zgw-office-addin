/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
* SPDX-License-Identifier: EUPL-1.2+
*/

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import fs from "fs";
import { ZaakController } from "../controller/ZaakController";
import { ZaakDto } from "../dto/ZaakParam";
import Fastify from "fastify";

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
  "/zaken/:zaakIdentificatie",
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
