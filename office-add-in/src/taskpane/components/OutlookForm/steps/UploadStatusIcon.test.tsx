/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { UploadStatusIcon } from "./UploadStatusIcon";
import { useMutationState } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useMutationState: vi.fn(),
}));

vi.mock("@fluentui/react-components", () => ({
  Spinner: () => <div data-testid="spinner">Spinner</div>,
  makeStyles: () => () => ({
    container: "container",
    withMargin: "withMargin",
    errorIcon: "errorIcon",
    successIcon: "successIcon",
  }),
  tokens: {
    colorPaletteRedForeground1: "red",
    colorPaletteGreenForeground1: "green",
    spacingHorizontalXS: "4px",
  },
}));

vi.mock("@fluentui/react-icons", () => ({
  Warning16Filled: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className}>
      Warning Icon
    </div>
  ),
  CheckmarkCircle16Filled: ({ className }: { className?: string }) => (
    <div data-testid="checkmark-icon" className={className}>
      Checkmark Icon
    </div>
  ),
}));

describe("UploadStatusIcon", () => {
  const mockUseMutationState = useMutationState as unknown as ReturnType<typeof vi.fn>;
  const TEST_ATTACHMENT_ID = "test-attachment-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when no matching mutation state exists", () => {
    mockUseMutationState.mockReturnValue([]);

    const { container } = render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render spinner when mutation status is pending", () => {
    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "pending",
          data: undefined,
          error: null,
          variables: { attachment: { id: TEST_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "pending",
        variables: { attachment: { id: TEST_ATTACHMENT_ID } },
      },
    ]);

    render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(screen.getByTestId("spinner")).toBeTruthy();
  });

  it("should render error icon with correct title when mutation status is error", () => {
    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "error",
          data: undefined,
          error: new Error("Upload failed"),
          variables: { attachment: { id: TEST_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "error",
        variables: { attachment: { id: TEST_ATTACHMENT_ID } },
      },
    ]);

    render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(screen.getByTestId("warning-icon")).toBeTruthy();
    expect(screen.getByTitle("Upload mislukt")).toBeTruthy(); // title of the icon
  });

  it("should render success icon with correct title when mutation status is success", () => {
    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "success",
          data: { id: "info-object-1" },
          error: null,
          variables: { attachment: { id: TEST_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "success",
        variables: { attachment: { id: TEST_ATTACHMENT_ID } },
      },
    ]);

    render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(screen.getByTestId("checkmark-icon")).toBeTruthy();
    expect(screen.getByTitle("Upload geslaagd")).toBeTruthy();
  });

  it("should filter mutations by attachmentId correctly", () => {
    const OTHER_ATTACHMENT_ID = "other-attachment-456";

    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "success",
          data: { id: "info-object-1" },
          error: null,
          variables: { attachment: { id: OTHER_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "success",
        variables: { attachment: { id: OTHER_ATTACHMENT_ID } },
      },
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "pending",
          data: undefined,
          error: null,
          variables: { attachment: { id: TEST_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "pending",
        variables: { attachment: { id: TEST_ATTACHMENT_ID } },
      },
    ]);

    render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    // Should show spinner for TEST_ATTACHMENT_ID (pending), not checkmark for OTHER_ATTACHMENT_ID
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(screen.queryByTestId("checkmark-icon")).toBeNull();
  });

  it("should handle mutations without attachment.id gracefully", () => {
    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "pending",
          data: undefined,
          error: null,
          variables: { attachment: {} }, // Missing id
          context: undefined,
          submittedAt: Date.now(),
        },
        status: "pending",
        variables: { attachment: {} },
      },
    ]);

    const { container } = render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(container.firstChild).toBeNull();
  });

  it("should call useMutationState with correct filters", () => {
    mockUseMutationState.mockReturnValue([]);

    render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(mockUseMutationState).toHaveBeenCalledWith({
      filters: { mutationKey: ["upload_document"] },
    });
  });

  it("should render nothing when mutation status is idle", () => {
    mockUseMutationState.mockReturnValue([
      {
        mutationKey: ["upload_document", "batch"],
        state: {
          status: "idle",
          data: undefined,
          error: null,
          variables: { attachment: { id: TEST_ATTACHMENT_ID } },
          context: undefined,
          submittedAt: undefined,
        },
        status: "idle",
        variables: { attachment: { id: TEST_ATTACHMENT_ID } },
      },
    ]);

    const { container } = render(<UploadStatusIcon attachmentId={TEST_ATTACHMENT_ID} />);

    expect(container.firstChild).toBeNull();
  });
});
