/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { AddDocumentSchema } from "./types";
import { useOffice } from "./useOffice";
import { useHttp } from "./useHttp";
import { ZrcType } from "../../../generated/zrc-generated-types";
import { useLogger } from "./useLogger";
import { getToken } from "../utils/getAccessToken";

type SuccessData = ZrcType<"ZaakInformatieObject">;

export function useAddDocumentToZaak(
  options?: UseMutationOptions<SuccessData, unknown, AddDocumentSchema>
) {
  const { getDocumentData, getFileName, host } = useOffice();
  const { POST } = useHttp();
  const { DEBUG } = useLogger(useAddDocumentToZaak.name);

  return useMutation({
    mutationKey: ["upload_document", "batch"],
    mutationFn: async (data: AddDocumentSchema) => {
      // Test logic: log incoming data
      const dataWithTitel = data as unknown as { titel?: string };
      DEBUG("[useAddDocumentToZaak] Received data:", {
        titel: dataWithTitel.titel,
        zaakidentificatie: data.zaakidentificatie,
      });

      // If zaakidentificatie is empty, log a warning with a sanitized snapshot
      if (!data.zaakidentificatie || data.zaakidentificatie.trim() === "") {
        try {
          const sanitized = { ...data } as Record<string, unknown>;
          if (typeof sanitized.inhoud === "string") {
            sanitized.inhoud = (sanitized.inhoud as string).substring(0, 200) + "...";
          }
          DEBUG("[useAddDocumentToZaak] empty zaakidentificatie detected");
          DEBUG(
            "[useAddDocumentToZaak] empty zaakidentificatie - request snapshot:",
            JSON.stringify(sanitized)
          );
        } catch {
          DEBUG("[useAddDocumentToZaak] empty zaakidentificatie - failed to snapshot request");
        }
      }

      const token = await getToken();
      const authorizattionHeader = {
        Authorization: `Bearer ${token}`,
      };

      return POST<SuccessData>(
        `/zaken/${data.zaakidentificatie}/documenten`,
        JSON.stringify(
          host === Office.HostType.Outlook
            ? { ...data }
            : {
                ...data,
                inhoud: await getDocumentData(),
                titel: await getFileName(),
              }
        ),
        authorizattionHeader
      );
    },
    ...options,
  });
}
