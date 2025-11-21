/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
export interface GraphAuthService {
  getAccessToken(): Promise<string>;
}

export interface GraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline?: boolean;
  contentBytes?: string; // Base64 encoded content for small attachments
}

export interface GraphMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  hasAttachments: boolean;
  attachments?: GraphAttachment[];
}
