/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";
import { useGetZaak } from "../hooks/useGetZaak";

type ZaakContextType = {
  setZaakToSearch: (_zaaknummer: string) => void;
  documentAdded: () => void;
  documentAddedToZaak: string | null;
  reset: () => void;
} & { zaak: ReturnType<typeof useGetZaak> };

const ZaakContext = createContext<ZaakContextType>({} as ZaakContextType);

export function ZaakProvider({ children }: PropsWithChildren) {
  const [zaakToSearch, setZaakToSearch] = useState<string | null>(null);
  const [documentAddedToZaak, setDocumentAddedToZaak] = useState<string | null>(null);
  const getZaak = useGetZaak(zaakToSearch);

  const documentAdded = useCallback(() => {
    setDocumentAddedToZaak(zaakToSearch);
    setZaakToSearch(null);
  }, [zaakToSearch]);

  const reset = useCallback(() => {
    setDocumentAddedToZaak(null);
  }, []);

  return (
    <ZaakContext.Provider
      value={{ setZaakToSearch, documentAdded, zaak: getZaak, documentAddedToZaak, reset }}
    >
      {children}
    </ZaakContext.Provider>
  );
}

export const useZaak = () => useContext(ZaakContext);
