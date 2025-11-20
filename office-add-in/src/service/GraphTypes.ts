/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";
import type { Attachment, Message } from "@microsoft/microsoft-graph-types";

export type GraphAttachment = Attachment;

export type GraphMessage = Message;

export interface GraphAuthProvider {
  getAccessToken(): Promise<string>;
}

export const jwtPayloadSchema = z
  .object({
    aud: z.string().optional(),
    exp: z.number().optional(),
    iat: z.number().optional(),
    scp: z.string().optional(),
    roles: z.array(z.string()).optional(),
    appid: z.string().optional(),
    azp: z.string().optional(),
  })
  .catchall(z.unknown());
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
