/*
 * SPDX-FileCopyrightText: 2021 - 2022 Atos, 2024-2025 Lifely
 * SPDX-License-Identifier: EUPL-1.2+
 */
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.listen({ port: 3003 }, () => {
  console.log("Server running on http://localhost:3003");
});

// Route to get a case by number
app.get("/zaak/:caseNumber", async (request) => {
  // @ts-ignore
  const { caseNumber } = request.params
  return { message: `GET: / zaak / ${caseNumber}` };
});



