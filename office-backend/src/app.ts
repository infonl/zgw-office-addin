import Fastify from 'fastify';

const fastify = Fastify();

const allowedOrigins = ['https://localhost:3000', 'https://chubby-planes-search.loca.lt']; // Allowed origins

fastify.addHook('onRequest', (request, reply, done) => {
  const origin = request.headers.origin;

  // @ts-ignore
  if (allowedOrigins.includes(origin)) {
    reply.headers({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    });
  }

  // Respond to OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    reply.status(200).send();  // Respond with 200 to preflight requests
    return;
  }

  done();
});

fastify.get('/zaken/:caseNumber', async (request, reply) => {
  // @ts-ignore
  const caseNumber = request.params.caseNumber;
  console.log('Received request for case number:', caseNumber);

  return { caseNumber };  // Mock response
});

// Start server
fastify.listen(3003, (err, address) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
