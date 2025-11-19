/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { AddDocumentSchema } from "./types";
import { useOffice } from "./useOffice";
import { useHttp } from "./useHttp";
import { GeneratedType } from "../../../generated/generated-types";

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
