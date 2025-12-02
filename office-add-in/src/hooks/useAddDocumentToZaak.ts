/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { AddDocumentSchema } from "./types";
import { useOffice } from "./useOffice";
import { useHttp } from "./useHttp";
import { ZrcType } from "../../../generated/zrc-generated-types";

type SuccessData = ZrcType<"ZaakInformatieObject">;

export function useAddDocumentToZaak(
  options?: UseMutationOptions<SuccessData, unknown, AddDocumentSchema>
) {
  const { getDocumentData, getFileName, host } = useOffice();
  const { POST } = useHttp();

  return useMutation({
    mutationFn: async (data: AddDocumentSchema) => {
      return POST<SuccessData>(
        `/zaken/${data.zaakidentificatie}/documenten`,
        JSON.stringify(
          host === Office.HostType.Outlook
            ? { ...data, titel: await getFileName() }
            : {
                ...data,
                inhoud: await getDocumentData(),
                titel: await getFileName(),
              }
        )
      );
    },
    ...options,
  });
}
