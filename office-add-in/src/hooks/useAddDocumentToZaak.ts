/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import * as zod from "zod";
import { useOffice } from "./useOffice";
import { useHttp } from "./useHttp";
import { GeneratedType } from "../../../generated/generated-types";

export const documentstatus = [
  "in_bewerking",
  "ter_vaststelling",
  "definitief",
  "gearchiveerd",
] as const;

export const addDocumentSchema = zod.object({
  vertrouwelijkheidaanduiding: zod.string(),
  informatieobjecttype: zod.string().url(),
  status: zod.enum(documentstatus),
  creatiedatum: zod.date(),
  zaakidentificatie: zod.string(),
  auteur: zod.string().min(1),
});

export type AddDocumentSchema = zod.infer<typeof addDocumentSchema>;

type SuccessData = GeneratedType<"ZaakInformatieObject">;
export function useAddDocumentToZaak(
  options?: UseMutationOptions<SuccessData, unknown, AddDocumentSchema>
) {
  const { getDocumentData, getFileName } = useOffice();
  const { POST } = useHttp();

  return useMutation({
    mutationFn: async (data: AddDocumentSchema) =>
      POST<SuccessData>(
        `/zaken/${data.zaakidentificatie}/documenten`,
        JSON.stringify({
          ...data,
          inhoud: await getDocumentData(),
          titel: await getFileName(),
        })
      ),
    ...options,
  });
}
