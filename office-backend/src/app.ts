/*
* SPDX-FileCopyrightText: 2025 INFO
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



