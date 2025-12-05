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
  isInitialized: true,
  getAccessToken: vi.fn(),
};

const vitestDummyLogger = {
  DEBUG: vi.fn(),
  LOG: vi.fn(),
  INFO: vi.fn(),
  WARN: vi.fn(),
  ERROR: vi.fn(),
};

const createService = () => {
  const service = new OfficeGraphAuthService(vitestDummyLogger);
  service.setMsalAuth(mockMsalAuth);
  return service;
};

// Valid Graph token payload
const createValidGraphToken = (expiresInMinutes = 60): string => {
  const payload: MicrosoftJwtPayload = {
    aud: "https://graph.microsoft.com",
    scp: "Mail.Read User.Read",
    exp: Math.round(addMinutes(new Date(), expiresInMinutes).getTime() / 1000),
    iat: Math.round(Date.now() / 1000),
  };
  // Create a fake JWT (header.payload.signature)
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `fake.${base64Payload}.signature`;
};

describe("OfficeGraphAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token caching", () => {
    it("returns cached token if still valid", async () => {
      const service = createService();
      service["tokenCache"] = {
        token: "cached-token",
        expires: addMinutes(new Date(), TOKEN_EXPIRY_OFFSET_MINUTES + 10).getTime(),
      };
      const token = await service.getAccessToken();
      expect(token).toBe("cached-token");
      expect(mockMsalAuth.getAccessToken).not.toHaveBeenCalled();
    });

    it("fetches new token if cached token is expired", async () => {
      const service = createService();
      service["tokenCache"] = {
        token: "expired-token",
        expires: Date.now() - 10000,
      };
      const validToken = createValidGraphToken();
      mockMsalAuth.getAccessToken.mockResolvedValue(validToken);

      const token = await service.getAccessToken();

      expect(mockMsalAuth.getAccessToken).toHaveBeenCalledWith(["Mail.Read", "User.Read"]);
      expect(token).toBe(validToken);
    });

    it("waits for already running token request", async () => {
      const service = createService();
      const promise = Promise.resolve("pending-token");
      service["tokenRequest"] = promise;

      const token = await service.getAccessToken();

      expect(token).toBe("pending-token");
      expect(mockMsalAuth.getAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("MSAL authentication", () => {
    it("successfully gets token from MSAL", async () => {
      const service = createService();
      const validToken = createValidGraphToken();
      mockMsalAuth.getAccessToken.mockResolvedValue(validToken);

      const token = await service.getAccessToken();

      expect(token).toBe(validToken);
      expect(mockMsalAuth.getAccessToken).toHaveBeenCalledWith(["Mail.Read", "User.Read"]);
    });

    it("throws error if MSAL auth is not available", async () => {
      const service = createService();
      service.setMsalAuth(null);

      await expect(service.getAccessToken()).rejects.toThrow("MSAL auth is not available");
    });

    it("throws error if MSAL fails", async () => {
      const service = createService();
      mockMsalAuth.getAccessToken.mockRejectedValue(new Error("MSAL login failed"));

      await expect(service.getAccessToken()).rejects.toThrow(
        "Graph authentication failed: MSAL login failed"
      );
    });
  });

  describe("Token validation", () => {
    it("rejects token with invalid audience", async () => {
      const service = createService();
      const payload: MicrosoftJwtPayload = {
        aud: "https://wrong-audience.com", // Wrong audience
        scp: "Mail.Read User.Read",
        exp: Math.round(addMinutes(new Date(), 60).getTime() / 1000),
      };
      const invalidToken = `fake.${Buffer.from(JSON.stringify(payload)).toString("base64")}.sig`;
      mockMsalAuth.getAccessToken.mockResolvedValue(invalidToken);

      await expect(service.getAccessToken()).rejects.toThrow(
        "Graph authentication failed: MSAL token audience https://wrong-audience.com is not valid for Graph API"
      );
    });

    it("rejects token with missing scopes", async () => {
      const service = createService();
      const payload: MicrosoftJwtPayload = {
        aud: "https://graph.microsoft.com",
        scp: "User.Read", // Missing Mail.Read
        exp: Math.round(addMinutes(new Date(), 60).getTime() / 1000),
      };
      const invalidToken = `fake.${Buffer.from(JSON.stringify(payload)).toString("base64")}.sig`;
      mockMsalAuth.getAccessToken.mockResolvedValue(invalidToken);

      await expect(service.getAccessToken()).rejects.toThrow(
        "Graph authentication failed: MSAL token missing required scopes. Required: Mail.Read, User.Read. Granted: User.Read"
      );
    });

    it("accepts token with Graph app ID as audience", async () => {
      const service = createService();
      const payload: MicrosoftJwtPayload = {
        aud: "00000003-0000-0000-c000-000000000000", // Graph app ID
        scp: "Mail.Read User.Read",
        exp: Math.round(addMinutes(new Date(), 60).getTime() / 1000),
      };
      const validToken = `fake.${Buffer.from(JSON.stringify(payload)).toString("base64")}.sig`;
      mockMsalAuth.getAccessToken.mockResolvedValue(validToken);

      const token = await service.getAccessToken();

      expect(token).toBe(validToken);
    });
  });

  describe("Token expiry handling", () => {
    it("uses JWT exp claim for cache expiry", async () => {
      const service = createService();
      const expiresInMinutes = 30;
      const validToken = createValidGraphToken(expiresInMinutes);
      mockMsalAuth.getAccessToken.mockResolvedValue(validToken);

      await service.getAccessToken();

      const cached = service["tokenCache"];
      expect(cached).not.toBeNull();

      // Should expire around 30 minutes minus offset
      const expectedExpiry = addMinutes(new Date(), expiresInMinutes - TOKEN_EXPIRY_OFFSET_MINUTES);
      const actualExpiry = new Date(cached!.expires);

      // Allow 1 second tolerance for test timing
      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it("uses default 50 minutes if JWT exp is missing", async () => {
      const service = createService();
      const payload = {
        aud: "https://graph.microsoft.com",
        scp: "Mail.Read User.Read",
        // No exp claim
      };
      const tokenWithoutExp = `fake.${Buffer.from(JSON.stringify(payload)).toString("base64")}.sig`;
      mockMsalAuth.getAccessToken.mockResolvedValue(tokenWithoutExp);

      await service.getAccessToken();

      const cached = service["tokenCache"];
      expect(cached).not.toBeNull();

      // Should use default 50 minutes minus offset
      const expectedExpiry = addMinutes(new Date(), 50 - TOKEN_EXPIRY_OFFSET_MINUTES);
      const actualExpiry = new Date(cached!.expires);

      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });
  });

  describe("validateGraphAccess", () => {
    it("returns true if token is retrieved successfully", async () => {
      const service = createService();
      const validToken = createValidGraphToken();
      mockMsalAuth.getAccessToken.mockResolvedValue(validToken);

      const result = await service.validateGraphAccess();

      expect(result).toBe(true);
    });

    it("returns false if token retrieval fails", async () => {
      const service = createService();
      mockMsalAuth.getAccessToken.mockRejectedValue(new Error("Auth failed"));

      const result = await service.validateGraphAccess();

      expect(result).toBe(false);
    });
  });
});
