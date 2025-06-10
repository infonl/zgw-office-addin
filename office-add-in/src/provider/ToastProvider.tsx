/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Toaster, useId, useToastController } from "@fluentui/react-components";
import React, { createContext, PropsWithChildren, useContext } from "react";

type ToastContextType = ReturnType<typeof useToastController>;

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export function ToastProvider({ children }: PropsWithChildren) {
  const toasterId = useId();
  const toasts = useToastController(toasterId);

  return (
    <ToastContext.Provider value={toasts}>
      <Toaster toasterId={toasterId} />
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
