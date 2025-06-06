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
    queryFn: () => new HttpService().GET<GeneratedType<"Zaak">>(`/zaken/${zaaknummer}`),
  });

  return query;
}
