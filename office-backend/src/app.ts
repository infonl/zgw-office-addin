import Fastify from "fastify";
import { start } from "repl";

const app = Fastify({ logger: true });

app.get("/", async () => {
  return { message: "Hello Fastify!" };
});

app.listen({ port: 3000 }, () => {
  console.log("Server running on http://localhost:3000");
});