/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DocumentIndicator } from "./DocumentIndicator";
import type { Schema } from "../hooks/useOutlookForm";

vi.spyOn(console, "debug").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("@fluentui/react-icons", () => ({
  Checkmark16Filled: () => <span data-testid="checkmark-icon" />,
}));

vi.mock("@fluentui/react-components", () => ({
  tokens: {
    spacingHorizontalS: "4px",
    colorPaletteGreenForeground1: "green",
  },
}));

const validDoc = {
  vertrouwelijkheidaanduiding: "openbaar" as const,
  informatieobjecttype: "https://example.com/type",
  status: "definitief" as const,
  creatiedatum: new Date("2025-01-15"),
  zaakidentificatie: "ZAAK-001",
  auteur: "Test",
};

function Wrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<Schema>;
}) {
  const methods = useForm<Schema>({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("DocumentIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when document at index is invalid (missing required fields)", () => {
    const { container } = render(
      <Wrapper
        defaultValues={{
          documents: [{ selected: false, attachment: {} as Office.AttachmentDetails }],
        }}
      >
        <DocumentIndicator index={0} />
      </Wrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders null when document is missing auteur (invalid metadata)", () => {
    const { container } = render(
      <Wrapper
        defaultValues={{
          documents: [
            {
              vertrouwelijkheidaanduiding: "openbaar" as const,
              informatieobjecttype: "https://example.com/type",
              status: "definitief" as const,
              creatiedatum: new Date("2025-01-15"),
              zaakidentificatie: "ZAAK-001",
              // auteur omitted — fails addDocumentSchema validation
              selected: false,
              attachment: {} as Office.AttachmentDetails,
            },
          ],
        }}
      >
        <DocumentIndicator index={0} />
      </Wrapper>
    );

    // addDocumentSchema requires auteur (min 1 char); missing it makes safeParse fail
    expect(container.firstChild).toBeNull();
  });

  it("renders the checkmark icon when document passes addDocumentSchema validation", () => {
    render(
      <Wrapper
        defaultValues={{
          documents: [
            {
              ...validDoc,
              selected: true,
              attachment: {} as Office.AttachmentDetails,
            },
          ],
        }}
      >
        <DocumentIndicator index={0} />
      </Wrapper>
    );

    expect(screen.getByTestId("checkmark-icon")).toBeTruthy();
  });

  it("renders the aria-label 'volledig' when valid", () => {
    render(
      <Wrapper
        defaultValues={{
          documents: [
            {
              ...validDoc,
              selected: true,
              attachment: {} as Office.AttachmentDetails,
            },
          ],
        }}
      >
        <DocumentIndicator index={0} />
      </Wrapper>
    );

    expect(screen.getByLabelText("volledig")).toBeTruthy();
  });
});
