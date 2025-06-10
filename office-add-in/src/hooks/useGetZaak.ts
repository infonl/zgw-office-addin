/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GeneratedType } from "../../../generated/generated-types";
import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./useHttp";

export type Zaak = Omit<GeneratedType<"Zaak">, "zaakinformatieobjecten"> & {
  zaaktype: GeneratedType<"ZaakType">;
  status: GeneratedType<"Status">;
  zaakinformatieobjecten: Array<
    GeneratedType<"ZaakInformatieObject"> & {
      vertrouwelijkheidaanduiding: string;
      omschrijving: string;
    }
  >;
};

export function useGetZaak(zaaknummer: string | null) {
  const { GET } = useHttp();

  return useQuery({
    queryKey: ["zaak", zaaknummer],
    enabled: !!zaaknummer,
    queryFn: () => GET<Zaak>(`/zaken/${zaaknummer}`),
  });
}
