import Fastify from "fastify";

const app = Fastify({ logger: true });

// Route to get a case by number
app.get("/zaak/:caseNumber", async (request) => {
  // @ts-ignore
  const { caseNumber } = request.params
  return { message: `GET: / zaak / ${caseNumber}` };
});

app.listen({ port: 3003 }, () => {
  console.log("Server running on http://localhost:3003");
});
