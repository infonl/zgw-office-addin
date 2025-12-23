/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZrcType } from "../../../generated/zrc-generated-types";
import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./useHttp";
import { getToken } from "../utils/getAccessToken";

export type Zaak = Omit<ZrcType<"Zaak">, "zaakinformatieobjecten"> & {
  zaaktype: ZrcType<"ZaakType">;
  status: ZrcType<"Status">;
  zaakinformatieobjecten: Array<
    ZrcType<"ZaakInformatieObject"> & {
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
    queryFn: async () => {
      const token = await getToken();
      const authorizattionHeader = {
        Authorization: `Bearer ${token}`,
      };
      console.log(authorizattionHeader);

      return GET<Zaak>(`/zaken/${zaaknummer}`, authorizattionHeader);
    },
  });
}
