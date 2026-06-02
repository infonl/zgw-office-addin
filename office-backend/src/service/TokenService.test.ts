/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { TokenService } from "./TokenService";
import { Unauthorized } from "../exception/Unauthorized";
import * as jwtDecodeModule from "jwt-decode";

vi.mock("jwt-decode");

describe("TokenService", () => {
  const service = new TokenService();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw Unauthorized if no token is provided", () => {
    expect(() => service.getTokenInfo(undefined)).toThrow(Unauthorized);
    expect(() => service.getTokenInfo("")).toThrow(Unauthorized);
  });

  it("should throw Unauthorized if token is missing required claims", () => {
    vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValueOnce({});
    expect(() => service.getTokenInfo("Bearer sometoken")).toThrow(Unauthorized);

    vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValueOnce({ preferred_username: "user" });
    expect(() => service.getTokenInfo("Bearer sometoken")).toThrow(Unauthorized);

    vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValueOnce({ name: "User" });
    expect(() => service.getTokenInfo("Bearer sometoken")).toThrow(Unauthorized);
  });

  it("should return userInfo if token has required claims", () => {
    vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValueOnce({
      preferred_username: "user",
      name: "User",
    });
    const result = service.getTokenInfo("Bearer validtoken");
    expect(result).toEqual({ preferredUsername: "user", name: "User" });
  });

  it("should throw Unauthorized if jwtDecode throws", () => {
    vi.mocked(jwtDecodeModule.jwtDecode).mockImplementationOnce(() => {
      throw new Error("bad token");
    });
    expect(() => service.getTokenInfo("Bearer badtoken")).toThrow(Unauthorized);
  });
});
