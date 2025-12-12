/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";
import { useGetZaak } from "../hooks/useGetZaak";

type ZaakContextType = {
  setZaakToSearch: (_zaaknummer: string) => void;
  documentAdded: (_options?: { uploadedEmail?: boolean; uploadedAttachments?: number }) => void;
  documentAddedToZaak: string | null;
  uploadedEmail?: boolean;
  uploadedAttachments?: number;
  reset: () => void;
} & { zaak: ReturnType<typeof useGetZaak> };

const ZaakContext = createContext<ZaakContextType>({} as ZaakContextType);

export function ZaakProvider({ children }: PropsWithChildren) {
  const [zaakToSearch, setZaakToSearch] = useState<string | null>(null);
  const [documentAddedToZaak, setDocumentAddedToZaak] = useState<string | null>(null);
  const [uploadedEmail, setUploadedEmail] = useState<boolean | undefined>(undefined);
  const [uploadedAttachments, setUploadedAttachments] = useState<number | undefined>(undefined);
  const getZaak = useGetZaak(zaakToSearch);

  const documentAdded = useCallback(
    (_options?: { uploadedEmail?: boolean; uploadedAttachments?: number }) => {
      setDocumentAddedToZaak(zaakToSearch);
      setZaakToSearch(null);
      setUploadedEmail(_options?.uploadedEmail);
      setUploadedAttachments(_options?.uploadedAttachments);
    },
    [zaakToSearch]
  );

  const reset = useCallback(() => {
    setDocumentAddedToZaak(null);
    setUploadedEmail(undefined);
    setUploadedAttachments(undefined);
  }, []);

  return (
    <ZaakContext.Provider
      value={{
        setZaakToSearch,
        documentAdded,
        zaak: getZaak,
        documentAddedToZaak,
        uploadedEmail,
        uploadedAttachments,
        reset,
      }}
    >
      {children}
    </ZaakContext.Provider>
  );
}

export const useZaak = () => useContext(ZaakContext);
