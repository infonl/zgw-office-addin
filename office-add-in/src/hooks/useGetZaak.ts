/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GeneratedType } from "../../../generated/generated-types";
import { HttpService } from "../service/http.service";
import { useQuery } from "@tanstack/react-query";

export function useGetZaak(zaaknummer: string) {
  const query = useQuery({
    queryKey: ["zaak", zaaknummer],
    enabled: !!zaaknummer,
    queryFn: () =>
      new HttpService().GET<
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
