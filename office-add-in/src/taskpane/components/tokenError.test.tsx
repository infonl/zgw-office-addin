/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { errorMessages, defaultError } from "../../tokenErrors";
import { describe, expect, it } from "vitest";
import { ShowTokenError } from "./tokenError";


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
      expect(screen.getByText(title)).not.toBeNull();
      expect(screen.getByText(message)).not.toBeNull();
      expect(screen.getByText(`Foutcode: ${code}`)).not.toBeNull();
    }
  );

  it("falls back to default error for unknown error code", () => {
    render(<ShowTokenError error={{ code: 99999 }} />);

    expect(screen.getByText(defaultError.title)).not.toBeNull();

    expect(screen.getByText(defaultError.message)).not.toBeNull();

    expect(screen.getByText("Foutcode: 99999")).not.toBeNull();
  });

  it("falls back to default error when error has no code", () => {
    render(<ShowTokenError error={{ message: "Something failed" }} />);

    console.debug("DEFAULTERROR: ", screen.getByText(defaultError.title).textContent)

    expect(screen.getByText(defaultError.title)).not.toBeNull();

    expect(screen.getByText(defaultError.message)).not.toBeNull();
  });
});
