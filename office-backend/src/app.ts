import Fastify from 'fastify';
import fs from 'fs';
import { ZaakService } from '../service/ZaakService';

const fastify = Fastify({
  https: {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
  },
});

// ✅ Manually handle CORS
fastify.addHook('onRequest', (request, reply, done) => {
  const allowedOrigins = ['https://localhost:3000', 'https://funny-stars-fall.loca.lt'];
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    reply.header('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    reply.status(200).send();
    return;
  }

  done();
});

fastify.get('/cases/:caseNumber', async (request, reply) => {
  const caseNumber = (request.params as { caseNumber: string }).caseNumber;
  console.log("Received request for case number:", caseNumber);
  return { caseNumber };
});

fastify.get('/zaken/:zaakNummer', async (request, reply) => {
  const zaakNummer = (request.params as { zaakNummer: string }).zaakNummer;
  const zaakService = new ZaakService();
  const response = zaakService.getZaken(zaakNummer);
  reply.send({ response });
});


fastify.listen({ port: 3003, host: '127.0.0.1' }, (err, address) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`🚀 Secure server running at ${address}`);
});

