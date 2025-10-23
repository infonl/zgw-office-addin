/*
 * SPDX-FileCopyrightText: 2025 INFO
 * SPDX-License-Identifier: EUPL-1.2+
 */

export type AttachmentFile = {
  id: string;
  name: string;
  size?: number;
  contentType?: string;
  isInline?: boolean;
};
