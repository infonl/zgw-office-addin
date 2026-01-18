/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "./Input";

// Test wrapper component
const TestWrapper = ({
  children,
  defaultValues,
  schema,
}: {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: Record<string, any>;
  schema?: z.ZodSchema;
}) => {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues || { testField: "" },
  });

  return (
    <FluentProvider theme={webLightTheme}>
      <FormProvider {...form}>{children}</FormProvider>
    </FluentProvider>
  );
};

describe("Input", () => {
  describe("Rendering", () => {
    it("renders with label", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Test Label" />
        </TestWrapper>
      );

      expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    });

    it("uses name as label when label prop is not provided", () => {
      render(
        <TestWrapper>
          <Input name="testField" />
        </TestWrapper>
      );

      expect(screen.getByLabelText("testField")).toBeInTheDocument();
    });

    it("marks field as required when prop is true", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Required Field" required />
        </TestWrapper>
      );

      const label = screen.getByText("Required Field");
      expect(label).toBeInTheDocument();
      // FluentUI adds an asterisk for required fields
    });
  });

  describe("Text Input", () => {
    it("allows user to type text", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input name="testField" label="Text Input" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Text Input") as HTMLInputElement;

      await user.type(input, "Hello World");

      expect(input.value).toBe("Hello World");
    });

    it("displays initial value from form", () => {
      render(
        <TestWrapper defaultValues={{ testField: "Initial Value" }}>
          <Input name="testField" label="Text Input" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Text Input") as HTMLInputElement;
      expect(input.value).toBe("Initial Value");
    });

    it("clears value when user deletes text", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ testField: "Initial" }}>
          <Input name="testField" label="Text Input" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Text Input") as HTMLInputElement;

      await user.clear(input);

      expect(input.value).toBe("");
    });
  });

  describe("Date Input", () => {
    it("renders date input with formatted value", () => {
      const testDate = new Date("2025-01-15T10:00:00Z");

      render(
        <TestWrapper defaultValues={{ dateField: testDate }}>
          <Input name="dateField" label="Date Input" type="date" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Date Input") as HTMLInputElement;
      expect(input.value).toBe("2025-01-15");
    });

    it("updates form value when date is selected", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ dateField: new Date() }}>
          <Input name="dateField" label="Date Input" type="date" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Date Input") as HTMLInputElement;

      await user.clear(input);
      await user.type(input, "2025-12-25");

      expect(input.value).toBe("2025-12-25");
    });

    it("handles empty date value", () => {
      render(
        <TestWrapper defaultValues={{ dateField: null }}>
          <Input name="dateField" label="Date Input" type="date" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Date Input") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Validation", () => {
    const schema = z.object({
      email: z.string().email("Invalid email format"),
      required: z.string().min(1, "This field is required"),
    });

    it("displays validation error for invalid email", async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      const TestForm = () => {
        const form = useForm({
          resolver: zodResolver(schema),
          defaultValues: { email: "", required: "test" },
        });

        return (
          <FluentProvider theme={webLightTheme}>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <Input name="email" label="Email" />
                <button type="submit">Submit</button>
              </form>
            </FormProvider>
          </FluentProvider>
        );
      };

      render(<TestForm />);

      const input = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", { name: /submit/i });

      await user.type(input, "invalid-email");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("prevents submission when required field is empty", async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      const TestForm = () => {
        const form = useForm({
          resolver: zodResolver(schema),
          defaultValues: { email: "test@example.com", required: "" },
        });

        return (
          <FluentProvider theme={webLightTheme}>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <Input name="required" label="Required Field" required />
                <button type="submit" disabled={!form.formState.isValid}>
                  Submit
                </button>
              </form>
            </FormProvider>
          </FluentProvider>
        );
      };

      render(<TestForm />);

      const submitButton = screen.getByRole("button", { name: /submit/i });

      // With empty required field, button should be disabled (matching real usage pattern)
      expect(submitButton).toBeDisabled();

      // Form should not be submittable
      expect(handleSubmit).not.toHaveBeenCalled();

      // Fill in the required field
      const input = screen.getByRole("textbox", { name: /required field/i });
      await user.type(input, "test value");

      // Now button should be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("clears error when valid value is entered", async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      const TestForm = () => {
        const form = useForm({
          resolver: zodResolver(schema),
          defaultValues: { email: "", required: "test" },
        });

        return (
          <FluentProvider theme={webLightTheme}>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <Input name="email" label="Email" />
                <button type="submit">Submit</button>
              </form>
            </FormProvider>
          </FluentProvider>
        );
      };

      render(<TestForm />);

      const input = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", { name: /submit/i });

      // Enter invalid email and submit to trigger validation
      await user.type(input, "invalid");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      });

      // Clear and enter valid email, then submit again
      await user.clear(input);
      await user.type(input, "valid@example.com");
      await user.click(submitButton);

      // Error should be cleared and form should submit
      await waitFor(() => {
        expect(screen.queryByText("Invalid email format")).not.toBeInTheDocument();
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("Read-only State", () => {
    it("disables input when readOnly is true", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Read Only" readOnly />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Read Only") as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it("allows input when readOnly is false", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Editable" readOnly={false} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Editable") as HTMLInputElement;
      expect(input).not.toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Styled Input" className="custom-class" />
        </TestWrapper>
      );

      const field = screen.getByLabelText("Styled Input").closest(".custom-class");
      expect(field).toBeInTheDocument();
    });

    it("applies custom style", () => {
      render(
        <TestWrapper>
          <Input name="testField" label="Styled Input" style={{ width: "200px" }} />
        </TestWrapper>
      );

      const field = screen.getByLabelText("Styled Input").closest('[style*="width"]');
      expect(field).toBeInTheDocument();
    });
  });
});
