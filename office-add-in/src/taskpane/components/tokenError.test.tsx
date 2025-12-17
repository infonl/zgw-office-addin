/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { errorMessages, defaultError } from "../../tokenErrors";
import { describe, expect, it } from "vitest";
import { ShowTokenError } from "./TokenError";


type OfficeErrorCase = {
  code: number;
  title: string;
  message: string;
};

const officeErrorCases: OfficeErrorCase[] = Object.entries(errorMessages).map(([code, value]) => ({
  code: Number(code),
  title: value.title,
  message: value.message,
}));

describe("ShowTokenError", () => {
  it("renders nothing when error is null", () => {
    const { container } = render(<ShowTokenError error={false} />);
    expect(container.firstChild).toBeNull();
  });

  it.each(officeErrorCases)(
    "renders correct message for Office error code $code",
    ({ code, title, message }) => {
      const error = {
        code,
        message,
        name,
      };
      render(<ShowTokenError error={error} />);

      const shownTitle = screen.getByTestId("token-error-title");
      expect(shownTitle.textContent).toBe(title);

      const shownMessage = screen.getByTestId("token-error-message");
      expect(shownMessage.textContent).toBe(message);

      const shownCode = screen.getByTestId("token-error-code");
      expect(shownCode.textContent).toContain(code);
    }
  );

  it("falls back to default error for unknown error code", () => {
    render(<ShowTokenError error={{ code: 99999 }} />);

    const shownTitle = screen.getByTestId("token-error-title");
    expect(shownTitle.textContent).toBe(defaultError.title);

    const shownMessage = screen.getByTestId("token-error-message");
    expect(shownMessage.textContent).toBe(defaultError.message);

    const shownCode = screen.getByTestId("token-error-code");
    expect(shownCode.textContent).toContain(String(99999));
  });

  it("falls back to default error when error has no code", () => {
    render(<ShowTokenError error={{ message: "Something failed" }} />);

    const title = screen.getByTestId("token-error-title");
    expect(title.textContent).toBe(defaultError.title);

    const message = screen.getByTestId("token-error-message");
    expect(message.textContent).toBe(defaultError.message);
  });
});
