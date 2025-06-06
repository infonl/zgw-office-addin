import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

export const onRequestLoggerHook = (
  request: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  console.debug(`[REQUEST] ${request.method} - ${request.url}`);

  done();
};
