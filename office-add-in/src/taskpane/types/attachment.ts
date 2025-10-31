/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export type AttachmentFile = {
  id: string;
  name: string;
  size?: number;
  contentType?: string;
  isInline?: boolean;
};
