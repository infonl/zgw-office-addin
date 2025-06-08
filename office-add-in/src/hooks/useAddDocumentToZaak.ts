/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import * as zod from "zod";
import { useOffice } from "./useOffice";

export const addDocumentSchema = zod
  .object({
    vertrouwelijkheidaanduiding: zod.string(),
    zaakinformatieobjectUrl: zod.string().url(),
    documentstatus: zod.string(),
    creatiedatum: zod.date({ coerce: true }),
    bestandsnaam: zod.string().min(1).max(100),
    zaakidentificatie: zod.string(),
  })
  .required();

export type AddDocumentSchema = zod.infer<typeof addDocumentSchema>;

export function useAddDocumentToZaak(
  options?: UseMutationOptions<void, unknown, AddDocumentSchema>
) {
  const { addDocumentToZaak } = useOffice();

  return useMutation({
    mutationFn: async (data: AddDocumentSchema) => {
      return addDocumentToZaak(data.zaakidentificatie, data);
    },
    ...options,
  });
}
