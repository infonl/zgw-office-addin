/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import "@testing-library/dom";
import { fromPartial } from "@total-typescript/shoehorn";
import { vi } from "vitest";

// Mock window.matchMedia for happy-dom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Office.js for testing
global.Office = fromPartial({
  onReady: vi.fn().mockResolvedValue({}),
  context: fromPartial({
    document: fromPartial({}),
    mailbox: fromPartial({
      item: undefined,
    }),
  }),
  MailboxEnums: {
    AttachmentType: {
      File: "file" as Office.MailboxEnums.AttachmentType.File,
      Item: "item" as Office.MailboxEnums.AttachmentType.Item,
      Cloud: "cloud" as Office.MailboxEnums.AttachmentType.Cloud,
      Base64: "base64" as Office.MailboxEnums.AttachmentType.Base64,
    },
    ItemNotificationMessageType: {
      InformationalMessage:
        "informationalMessage" as Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
      ErrorMessage: "errorMessage" as Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage,
      ProgressIndicator:
        "progressIndicator" as Office.MailboxEnums.ItemNotificationMessageType.ProgressIndicator,
    },
  },
  auth: {
    getAccessToken: vi.fn(),
  },
});
