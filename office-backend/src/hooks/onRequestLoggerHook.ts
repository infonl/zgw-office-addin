/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";
import { LoggerService } from "../service/LoggerService";

export const onRequestLoggerHook = (
  request: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  LoggerService.debug(`[REQUEST] ${request.method} - ${request.url}`);

  done();
};
