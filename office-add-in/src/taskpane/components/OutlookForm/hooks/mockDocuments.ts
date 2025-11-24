/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export const mockAttachment1 = {
  id: "mock-attachment-1",
  name: "mockfile1.txt",
  size: 1234,
  contentType: "text/plain",
  attachmentType: "file",
  isInline: false,
};

export const mockAttachment2 = {
  id: "mock-attachment-2",
  name: "mockfile2.txt",
  size: 5678,
  contentType: "text/plain",
  attachmentType: "file",
  isInline: false,
};

export const mockEmailAttachment = {
  id: "EmailItself-001",
  name: "email.eml",
  size: 2048,
  contentType: "message/rfc822",
  attachmentType: "item",
  isInline: false,
};

export const mockEmailDocument = {
  vertrouwelijkheidaanduiding: "openbaar",
  informatieobjecttype: "https://example.com/type/email",
  status: "in_bewerking" as const,
  creatiedatum: new Date(),
  zaakidentificatie: "ZAAK-001",
  auteur: "vi-test",
  selected: true as const,
  attachment: mockEmailAttachment,
};

export const mockAttachmentDocument1 = {
  vertrouwelijkheidaanduiding: "openbaar",
  informatieobjecttype: "https://example.com/type/attachment",
  status: "in_bewerking" as const,
  creatiedatum: new Date(),
  zaakidentificatie: "ZAAK-001",
  auteur: "vi-test",
  selected: true as const,
  attachment: mockAttachment1,
};

export const mockAttachmentDocument2 = {
  vertrouwelijkheidaanduiding: "openbaar",
  informatieobjecttype: "https://example.com/type/attachment",
  status: "in_bewerking" as const,
  creatiedatum: new Date(),
  zaakidentificatie: "ZAAK-001",
  auteur: "vi-test",
  selected: true as const,
  attachment: mockAttachment2,
};
