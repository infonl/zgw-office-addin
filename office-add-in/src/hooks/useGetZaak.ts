/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GeneratedType } from "../../../generated/generated-types";
import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./useHttp";

export function useGetZaak(zaaknummer: string) {
  const { GET } = useHttp();

  const query = useQuery({
    queryKey: ["zaak", zaaknummer],
    enabled: !!zaaknummer,
    queryFn: () =>
      GET<
        Omit<GeneratedType<"Zaak">, "zaakinformatieobjecten"> & {
          zaaktype: Omit<GeneratedType<"ZaakType">, "statustypen"> & {
            statustypen: Array<{
              url: string;
              omschrijving: string;
            }>;
          };
          zaakinformatieobjecten: Array<
            GeneratedType<"ZaakInformatieObject"> & {
              vertrouwelijkheidaanduiding: string;
              omschrijving: string;
            }
          >;
        }
      >(`/zaken/${zaaknummer}`),
  });

  return query;
}
