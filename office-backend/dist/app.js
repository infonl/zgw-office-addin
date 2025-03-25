"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const app = (0, fastify_1.default)();
app.get('/', async (request, reply) => {
    return { message: 'Hello from Fastify Backend!' };
});
const start = async () => {
    try {
        await app.listen({ port: 3001, host: '0.0.0.0' });
        console.log('🚀 Server running on http://localhost:3001');
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
start();
