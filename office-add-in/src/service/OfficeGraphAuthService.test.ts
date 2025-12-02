/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OfficeGraphAuthService } from "./OfficeGraphAuthService";
import { TOKEN_EXPIRY_OFFSET_MINUTES } from "../constants";
import { MicrosoftJwtPayload } from "./GraphTypes";
import { addMinutes } from "date-fns";

const mockMsalAuth = {
  getAccessToken: vi.fn(),
};

const vitestDummyLogger = {
  DEBUG: () => {},
  LOG: () => {},
  INFO: () => {},
  WARN: () => {},
  ERROR: () => {},
};

const createService = () => {
  const service = new OfficeGraphAuthService(vitestDummyLogger);
  service.setMsalAuth(mockMsalAuth);
  return service;
};

describe("OfficeGraphAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached token if valid", async () => {
    const service = createService();
    service["tokenCache"] = {
      token: "cached-token",
      expires: addMinutes(new Date(), TOKEN_EXPIRY_OFFSET_MINUTES + 10).getTime(),
    };
    const token = await service.getAccessToken();
    expect(token).toBe("cached-token");
  });

  it("waits for already running token request", async () => {
    const service = createService();
    const promise = Promise.resolve("pending-token");
    service["tokenRequest"] = promise;
    const token = await service.getAccessToken();
    expect(token).toBe("pending-token");
  });

  it("fetches new token if cached token is expired", async () => {
    const service = createService();
    service["tokenCache"] = {
      token: "expired-token",
      expires: Date.now() - 10000,
    };
    const mockJwtPayload: MicrosoftJwtPayload = {
      aud: "https://graph.microsoft.com",
      scp: "Mail.Read User.Read",
      exp: Math.round(addMinutes(new Date(), 1).getTime() / 1000),
    };
    (Office.auth.getAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue("new-token");
    vi.spyOn(Object.getPrototypeOf(service), "decodeJwtPayload").mockReturnValue(mockJwtPayload);
    const token = await service.getAccessToken();
    expect(token).toBe("new-token");
    expect(Office.auth.getAccessToken).toHaveBeenCalled();
  });

  it("requests a new token via Office.auth", async () => {
    const mockJwtPayload: MicrosoftJwtPayload = {
      aud: "https://graph.microsoft.com",
      scp: "Mail.Read User.Read",
      exp: Math.round(addMinutes(new Date(), 1).getTime() / 1000),
    };
    const service = createService();
    (Office.auth.getAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue("office-token");
    vi.spyOn(Object.getPrototypeOf(service), "decodeJwtPayload").mockReturnValue(mockJwtPayload);
    const token = await service.getAccessToken();
    expect(token).toBe("office-token");
    expect(Office.auth.getAccessToken).toHaveBeenCalled();
  });

  it("falls back to MSAL if Office.auth fails and env is local", async () => {
    const service = createService();
    service["env"].APP_ENV = "local";
    (Office.auth.getAccessToken as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: "401",
      message: "fail",
    });
    mockMsalAuth.getAccessToken.mockResolvedValue("msal-token");
    const token = await service.getAccessToken();
    expect(token).toBe("msal-token");
    expect(mockMsalAuth.getAccessToken).toHaveBeenCalled();
  });

  it("throws error if both Office.auth and MSAL fail", async () => {
    const mockJwtPayload: MicrosoftJwtPayload = {
      aud: "https://graph.microsoft.com",
      scp: "Mail.Read User.Read",
      exp: Math.round(addMinutes(new Date(), 1).getTime() / 1000),
    };
    const service = createService();
    (Office.auth.getAccessToken as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: "401",
      message: "fail",
    });
    mockMsalAuth.getAccessToken.mockRejectedValue(new Error("msal fail"));
    vi.spyOn(Object.getPrototypeOf(service), "decodeJwtPayload").mockReturnValue(mockJwtPayload);
    await expect(service.getAccessToken()).rejects.toThrow("Graph authentication failed");
  });

  it("throws error if Office.auth fails and env is prod", async () => {
    const service = createService();
    service["env"].APP_ENV = "production";
    (Office.auth.getAccessToken as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: "401",
      message: "fail",
    });
    await expect(service.getAccessToken()).rejects.toThrow("Graph authentication failed");
    expect(mockMsalAuth.getAccessToken).not.toHaveBeenCalled(); // only for local
  });

  it("validateGraphAccess returns true if token is retrieved", async () => {
    const service = createService();
    service.getAccessToken = vi.fn().mockResolvedValue("token");
    const result = await service.validateGraphAccess();
    expect(result).toBe(true);
  });

  it("validateGraphAccess returns false if token fails", async () => {
    const service = createService();
    service.getAccessToken = vi.fn().mockRejectedValue(new Error("fail"));
    const result = await service.validateGraphAccess();
    expect(result).toBe(false);
  });
});
