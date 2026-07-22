/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { MetadataStep } from "./MetadataStep";
import { mockAttachmentDocument1, mockAttachmentDocument2 } from "../hooks/mockDocuments";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../../provider/ZaakProvider", () => ({
  useZaak: () => ({
    zaak: {
      data: {
        identificatie: "ZAAK-001",
        zaakinformatieobjecten: [],
      },
    },
  }),
}));

vi.mock("../../DocumentMetadataFields", () => ({
  DocumentMetadataFields: () => <div data-testid="document-metadata-fields" />,
}));

vi.mock("./DocumentIndicator", () => ({
  DocumentIndicator: (props: { index: number }) => (
    <div data-testid={`document-indicator-${props.index}`} />
  ),
}));

vi.mock("./UploadStatusIcon", () => ({
  UploadStatusIcon: (props: { attachmentId: string }) => (
    <div data-testid={`upload-status-${props.attachmentId}`} />
  ),
}));

vi.mock("../../styles/shared", () => ({
  useCommonStyles: () => ({
    title: "title",
    messageBar: "messageBar",
    messageInline: "messageInline",
    messageTitleNoWrap: "messageTitleNoWrap",
  }),
}));

vi.mock("@fluentui/react-components", () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  AccordionHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Subtitle1: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Body1: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Body1Strong: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
  makeStyles: () => () => ({}),
  tokens: {},
}));

// Also mock the types module so addDocumentSchema.safeParse works simply
vi.mock("../../../../hooks/types", () => ({
  addDocumentSchema: { safeParse: () => ({ success: false }) },
  documentstatus: [],
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const unselectedDoc = {
  selected: false as const,
  attachment: {
    id: "unsel-1",
    name: "unsel.txt",
    size: 0,
    contentType: "text/plain",
    contentId: "",
    attachmentType: "file" as const,
    isInline: false,
  },
};

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

type Document =
  typeof mockAttachmentDocument1 | typeof mockAttachmentDocument2 | typeof unselectedDoc;

function Wrapper({
  documents,
  isUploading,
  isDisabled,
}: {
  documents: Document[];
  isUploading?: boolean;
  isDisabled?: boolean;
}) {
  const methods = useForm({ defaultValues: { documents } });
  return (
    <FormProvider {...methods}>
      <MetadataStep isUploading={isUploading} isDisabled={isDisabled} />
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MetadataStep", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the 'Bestandsgegevens' heading", () => {
    render(<Wrapper documents={[]} />);
    expect(screen.getByText("Bestandsgegevens")).toBeTruthy();
  });

  it("renders the zaak identificatie from useZaak", () => {
    render(<Wrapper documents={[]} />);
    expect(screen.getByText("ZAAK-001")).toBeTruthy();
  });

  it("renders only selected documents, not unselected ones", () => {
    render(
      <Wrapper documents={[mockAttachmentDocument1, unselectedDoc, mockAttachmentDocument2]} />
    );

    // Selected documents have their UploadStatusIcon rendered
    expect(
      screen.getByTestId(`upload-status-${mockAttachmentDocument1.attachment.id}`)
    ).toBeTruthy();
    expect(
      screen.getByTestId(`upload-status-${mockAttachmentDocument2.attachment.id}`)
    ).toBeTruthy();

    // Unselected document must NOT produce an upload-status icon
    expect(screen.queryByTestId(`upload-status-${unselectedDoc.attachment.id}`)).toBeNull();
  });

  it("renders DocumentMetadataFields for each selected document", () => {
    render(<Wrapper documents={[mockAttachmentDocument1, mockAttachmentDocument2]} />);

    const fields = screen.getAllByTestId("document-metadata-fields");
    expect(fields).toHaveLength(2);
  });

  it("renders UploadStatusIcon for each selected document by attachmentId", () => {
    render(<Wrapper documents={[mockAttachmentDocument1, mockAttachmentDocument2]} />);

    expect(
      screen.getByTestId(`upload-status-${mockAttachmentDocument1.attachment.id}`)
    ).toBeTruthy();
    expect(
      screen.getByTestId(`upload-status-${mockAttachmentDocument2.attachment.id}`)
    ).toBeTruthy();
  });

  it("shows the instructional body text when not disabled", () => {
    render(<Wrapper documents={[mockAttachmentDocument1]} />);
    expect(screen.getByText("Vul bij elk bestand de bijbehorende metadata in.")).toBeTruthy();
  });

  it("hides the instructional body text when isUploading=true", () => {
    render(<Wrapper documents={[mockAttachmentDocument1]} isUploading={true} />);
    expect(screen.queryByText("Vul bij elk bestand de bijbehorende metadata in.")).toBeNull();
  });

  it("hides DocumentIndicator when isDisabled=true", () => {
    render(<Wrapper documents={[mockAttachmentDocument1]} isDisabled={true} />);
    expect(screen.queryByTestId("document-indicator-0")).toBeNull();
  });

  it("shows DocumentIndicator when isDisabled=false and isUploading=false", () => {
    render(
      <Wrapper documents={[mockAttachmentDocument1]} isDisabled={false} isUploading={false} />
    );
    // DocumentIndicator is rendered for the selected document (index 0)
    expect(screen.getByTestId("document-indicator-0")).toBeTruthy();
  });

  it("renders nothing extra for unselected documents", () => {
    render(<Wrapper documents={[unselectedDoc]} />);

    // No metadata fields, no upload status, no indicator for the unselected doc
    expect(screen.queryByTestId("document-metadata-fields")).toBeNull();
    expect(screen.queryByTestId(`upload-status-${unselectedDoc.attachment.id}`)).toBeNull();
    expect(screen.queryByTestId("document-indicator-0")).toBeNull();
  });
});
