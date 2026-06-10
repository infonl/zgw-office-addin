/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SelectItems } from "./SelectItems";

vi.mock("../../form/Checkbox", () => ({
  CheckBox: (props: { name: string; label: string }) => (
    <div data-testid={`checkbox-${props.name}`} data-label={props.label} />
  ),
}));

vi.mock("@fluentui/react-components", () => ({
  Subtitle1: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Body1: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  tokens: {},
}));

const makeDoc = (id: string, name: string) => ({
  selected: false as const,
  attachment: {
    id,
    name,
    size: 0,
    contentType: "text/plain",
    contentId: "",
    attachmentType: "file",
    isInline: false,
  },
});

function Wrapper({ documents }: { documents: ReturnType<typeof makeDoc>[] }) {
  const methods = useForm({ defaultValues: { documents } });
  return (
    <FormProvider {...methods}>
      <SelectItems />
    </FormProvider>
  );
}

describe("SelectItems", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders heading 'Bestanden selecteren'", () => {
    render(<Wrapper documents={[]} />);
    expect(screen.getByText("Bestanden selecteren")).toBeTruthy();
  });

  it("renders descriptive body text", () => {
    render(<Wrapper documents={[]} />);
    expect(
      screen.getByText("Selecteer welke bestanden je wil koppelen aan bovenstaande zaak.")
    ).toBeTruthy();
  });

  it("renders no checkboxes when documents list is empty", () => {
    render(<Wrapper documents={[]} />);
    expect(screen.queryAllByTestId(/^checkbox-/)).toHaveLength(0);
  });

  it("renders one CheckBox per document with correct label", () => {
    const documents = [makeDoc("id-1", "file-a.pdf"), makeDoc("id-2", "file-b.docx")];
    render(<Wrapper documents={documents} />);

    const checkboxes = screen.getAllByTestId(/^checkbox-/);
    expect(checkboxes).toHaveLength(2);

    expect(checkboxes[0].getAttribute("data-label")).toBe("file-a.pdf");
    expect(checkboxes[1].getAttribute("data-label")).toBe("file-b.docx");
  });

  it("renders CheckBox with correct field name per index", () => {
    const documents = [makeDoc("id-1", "alpha.txt"), makeDoc("id-2", "beta.txt")];
    render(<Wrapper documents={documents} />);

    expect(screen.getByTestId("checkbox-documents.0.selected")).toBeTruthy();
    expect(screen.getByTestId("checkbox-documents.1.selected")).toBeTruthy();
  });

  it("uses attachment.id as the React key — two documents both render", () => {
    const documents = [makeDoc("key-a", "one.txt"), makeDoc("key-b", "two.txt")];
    render(<Wrapper documents={documents} />);

    // Both checkboxes are present in the DOM, confirming no key collision caused drops
    expect(screen.getByTestId("checkbox-documents.0.selected")).toBeTruthy();
    expect(screen.getByTestId("checkbox-documents.1.selected")).toBeTruthy();
    expect(screen.getAllByTestId(/^checkbox-/)).toHaveLength(2);
  });
});
