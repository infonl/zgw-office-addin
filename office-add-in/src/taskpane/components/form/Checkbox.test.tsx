/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CheckBox } from "./Checkbox";
import { useFormError } from "./hooks/useFormError";

vi.spyOn(console, "debug").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("@fluentui/react-components", () => ({
  Checkbox: ({
    checked,
    onChange,
    onBlur,
    name,
    label,
  }: {
    checked: boolean;
    onChange: (_event: React.ChangeEvent<HTMLInputElement>, _data: { checked: boolean }) => void;
    onBlur: () => void;
    name: string;
    label: string;
  }) => (
    <input
      type="checkbox"
      data-testid="fluent-checkbox"
      checked={checked}
      onChange={(e) => onChange(e, { checked: e.target.checked })}
      onBlur={onBlur}
      name={name}
      aria-label={String(label)}
    />
  ),
  Field: ({
    children,
    validationState,
    validationMessage,
  }: {
    children: React.ReactNode;
    validationState: string;
    validationMessage?: string;
  }) => (
    <div data-validation={validationState}>
      {children}
      {validationMessage && <span data-testid="validation-message">{validationMessage}</span>}
    </div>
  ),
}));

vi.mock("./hooks/useFormError", () => ({
  useFormError: vi.fn().mockReturnValue(null),
}));

function Wrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("CheckBox", () => {
  beforeEach(() => {
    vi.mocked(useFormError).mockReturnValue(null);
  });

  it("renders the label text", () => {
    render(
      <Wrapper>
        <CheckBox name="agree" label="I agree" />
      </Wrapper>
    );

    const checkbox = screen.getByTestId("fluent-checkbox");
    expect(checkbox.getAttribute("aria-label")).toBe("I agree");
  });

  it("falls back to name as label when no label prop", () => {
    render(
      <Wrapper>
        <CheckBox name="myField" />
      </Wrapper>
    );

    const checkbox = screen.getByTestId("fluent-checkbox");
    expect(checkbox.getAttribute("aria-label")).toBe("myField");
  });

  it("shows no validation message when no error", () => {
    vi.mocked(useFormError).mockReturnValue(null);

    render(
      <Wrapper>
        <CheckBox name="agree" label="I agree" />
      </Wrapper>
    );

    expect(screen.queryByTestId("validation-message")).toBeNull();
  });

  it("shows validation message and error state when useFormError returns a string", () => {
    vi.mocked(useFormError).mockReturnValue("This field is required");

    render(
      <Wrapper>
        <CheckBox name="agree" label="I agree" />
      </Wrapper>
    );

    const message = screen.getByTestId("validation-message");
    expect(message.textContent).toBe("This field is required");

    const field = message.parentElement;
    expect(field?.getAttribute("data-validation")).toBe("error");
  });

  it("checkbox is unchecked by default when form value is undefined", () => {
    render(
      <Wrapper>
        <CheckBox name="agree" label="I agree" />
      </Wrapper>
    );

    const checkbox = screen.getByTestId("fluent-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("checkbox reflects the form value when defaultValues sets it true", () => {
    render(
      <Wrapper defaultValues={{ agree: true }}>
        <CheckBox name="agree" label="I agree" />
      </Wrapper>
    );

    const checkbox = screen.getByTestId("fluent-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
