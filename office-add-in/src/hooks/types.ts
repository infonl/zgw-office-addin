/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import z from "zod";

export const documentstatus = [
  "in_bewerking",
  "ter_vaststelling",
  "definitief",
  "gearchiveerd",
] as const;

export const addDocumentSchema = z.object({
  vertrouwelijkheidaanduiding: z.string(),
  informatieobjecttype: z.string().url(),
  status: z.enum(documentstatus),
  creatiedatum: z.date(),
  zaakidentificatie: z.string(),
  auteur: z.string().min(1),
});

export type AddDocumentSchema = z.infer<typeof addDocumentSchema>;

export const document = z.discriminatedUnion("selected", [
  addDocumentSchema.extend({
    selected: z.literal(true),
    attachment: z.custom<Office.AttachmentDetails>(),
  }),
  z
    .object({
      selected: z.literal(false),
      attachment: z.custom<Office.AttachmentDetails>(),
    })
    .passthrough(),
]);

export type DocumentSchema = z.infer<typeof document>;

export type ZaakResponse = { data?: { identificatie?: string } };

export type ProcessedDocument = DocumentSchema & {
  graphId: string | null;
  parentEmailGraphId: string | null;
};

export type GraphServiceType = {
  getEmailAsEML: (_graphId: string) => Promise<string>;
  getAttachmentContent: (
    _parentGraphId: string,
    _graphAttachmentId: string
  ) => Promise<ArrayBuffer>;
};
