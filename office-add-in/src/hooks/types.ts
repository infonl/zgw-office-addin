/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import z from "zod";
import type { Control, FieldValues } from "react-hook-form";

export const documentstatus = [
  "in_bewerking",
  "ter_vaststelling",
  "definitief",
  "gearchiveerd",
] as const;

export const vertrouwelijkheidaanduiding = [
  "openbaar",
  "beperkt_openbaar",
  "intern",
  "zaakvertrouwelijk",
  "vertrouwelijk",
  "confidentieel",
  "geheim",
  "zeer_geheim",
] as const;

export const vertrouwelijkheidaanduidingSchema = z.enum(vertrouwelijkheidaanduiding);

export type VertrouwelijkheidaanduidingType = z.infer<typeof vertrouwelijkheidaanduidingSchema>;

export const addDocumentSchema = z.object({
  vertrouwelijkheidaanduiding: z.enum(vertrouwelijkheidaanduiding),
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

export type SelectedDocument = Extract<DocumentSchema, { selected: true }>;

export type TokenErrorProps = {
  error: { code?: number; message?: string } | boolean;
};
export type ProcessedDocument = SelectedDocument & {
  graphId: string | null;
  parentEmailGraphId: string | null;
};

export type ZaakResponse = { data?: { identificatie?: string } };

export type GraphServiceType = {
  getEmailAsEML: (_graphId: string) => Promise<string>;
  getAttachmentContent: (
    _parentGraphId: string,
    _graphAttachmentId: string
  ) => Promise<ArrayBuffer>;
};

export type UploadDocumentMutationVariables = {
  attachment?: {
    id?: string;
  };
};

export type DocumentMetadataFieldsProps<T extends FieldValues> = {
  zaakinformatieobjecten: {
    omschrijving: string;
    url?: string;
    vertrouwelijkheidaanduiding?: string;
  }[];
  statuses: typeof documentstatus;
  namePrefix?: string;
  control: Control<T>;
export type UseUploadStatusProps = {
  selectedDocuments: DocumentSchema[];
};

export type UseUploadStatusReturn = {
  selectedDocumentIds: string[];
  activeMutations: Set<string>;
  completedIds: Set<string>;
  failedIds: Set<string>;
  isUploading: boolean;
  uploadComplete: boolean;
  uploadedEmail: boolean;
  uploadedAttachments: number;
  errorCount: number;
  uploadError: boolean;
  uploadSuccess: boolean;
};
