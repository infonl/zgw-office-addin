/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { Attachment, Message } from "@microsoft/microsoft-graph-types";
import type { JwtPayload } from "jwt-decode";

export type GraphAttachment = Attachment;

export type GraphMessage = Message;

export interface GraphAuthProvider {
  getAccessToken(): Promise<string>;
}

export type MicrosoftJwtPayload = JwtPayload & {
  aud?: string;
  exp?: number;
  iat?: number;
  scp?: string;
  roles?: string[];
  appid?: string;
  azp?: string;
  [key: string]: unknown;
};
