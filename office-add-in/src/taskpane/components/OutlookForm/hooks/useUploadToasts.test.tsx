/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUploadToasts } from "./useUploadToasts";

const mockDispatchToast = vi.fn();
const mockDismissToast = vi.fn();

vi.mock("../../../../provider/ToastProvider", () => ({
  useToast: () => ({
    dispatchToast: mockDispatchToast,
    dismissToast: mockDismissToast,
  }),
}));

describe("useUploadToasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showUploadingToast", () => {
    it("dispatches info toast with uploading-documents id", () => {
      const { result } = renderHook(() => useUploadToasts());
      result.current.showUploadingToast(3, "ZAAK-001");

      expect(mockDispatchToast).toHaveBeenCalledTimes(1);
      expect(mockDispatchToast).toHaveBeenCalledWith(expect.anything(), {
        intent: "info",
        toastId: "uploading-documents",
      });
    });
  });

  describe("showErrorToast", () => {
    it("dismisses uploading toast before showing error toast", () => {
      const { result } = renderHook(() => useUploadToasts());
      result.current.showErrorToast(2, 5);

      expect(mockDismissToast).toHaveBeenCalledWith("uploading-documents");
      expect(mockDismissToast).toHaveBeenCalledBefore(mockDispatchToast);
      expect(mockDispatchToast).toHaveBeenCalledWith(expect.anything(), { intent: "error" });
    });
  });

  describe("showSuccessToast", () => {
    it("dismisses uploading toast before showing success toast", () => {
      const { result } = renderHook(() => useUploadToasts());
      result.current.showSuccessToast(false, 3);

      expect(mockDismissToast).toHaveBeenCalledWith("uploading-documents");
      expect(mockDismissToast).toHaveBeenCalledBefore(mockDispatchToast);
      expect(mockDispatchToast).toHaveBeenCalledWith(expect.anything(), { intent: "success" });
    });
  });

  describe("showGeneralErrorToast", () => {
    it("dismisses uploading toast before showing general error toast", () => {
      const { result } = renderHook(() => useUploadToasts());
      result.current.showGeneralErrorToast();

      expect(mockDismissToast).toHaveBeenCalledWith("uploading-documents");
      expect(mockDismissToast).toHaveBeenCalledBefore(mockDispatchToast);
      expect(mockDispatchToast).toHaveBeenCalledWith(expect.anything(), { intent: "error" });
    });
  });
});
