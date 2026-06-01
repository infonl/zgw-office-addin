/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZaakController } from "./ZaakController";
import { ZaakService } from "../service/ZaakService";
import { Unauthorized } from "../exception/Unauthorized";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZaakParam } from "../dto/ZaakParam";
import { TokenService } from "../service/TokenService";

const mockTokenInfo = {
  preferredUsername: "test-user",
  name: "Test User",
  uti: "fakeUti",
};

const mockReply = {
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
} as unknown as FastifyReply;

function makeGetRequest(authorization?: string, zaakIdentificatie = "ZAAK-001") {
  return {
    headers: { authorization },
    params: { zaakIdentificatie },
  } as unknown as FastifyRequest<{ Params: ZaakParam }>;
}

function makePostRequest(
  authorization?: string,
  zaakIdentificatie = "ZAAK-001",
  body: Record<string, unknown> = {},
) {
  return {
    headers: { authorization },
    params: { zaakIdentificatie },
    body,
  } as unknown as FastifyRequest<{ Params: ZaakParam; Body: Record<string, unknown> }>;
}

describe("ZaakController", () => {
  let controller: ZaakController;
  let mockZaakService: {
    getZaak: ReturnType<typeof vi.fn>;
    addDocumentToZaak: ReturnType<typeof vi.fn>;
  };
  let mockTokenService: {
    getTokenInfo: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockZaakService = {
      getZaak: vi.fn().mockResolvedValue({ identificatie: "ZAAK-001" }),
      addDocumentToZaak: vi.fn().mockResolvedValue({ url: "https://example.com/doc/1" }),
    };
    mockTokenService = {
      getTokenInfo: vi.fn().mockReturnValue(mockTokenInfo),
    };
    controller = new ZaakController(
      mockTokenService as unknown as TokenService,
      mockZaakService as unknown as ZaakService,
    );
  });

  describe("getZaak", () => {
    it("resolves userInfo from the authorization header and passes it to the service", async () => {
      await controller.getZaak(makeGetRequest("Bearer valid.jwt"), mockReply);

      expect(mockTokenService.getTokenInfo).toHaveBeenCalledWith("Bearer valid.jwt");
      expect(mockZaakService.getZaak).toHaveBeenCalledWith("ZAAK-001", mockTokenInfo, undefined);
    });

    it("returns 200 with the zaak returned by the service", async () => {
      const zaak = { identificatie: "ZAAK-001", status: "open" };
      mockZaakService.getZaak.mockResolvedValue(zaak);

      await controller.getZaak(makeGetRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(zaak);
    });

    it("returns 401 when the authorization header is missing", async () => {
      mockTokenService.getTokenInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.getZaak(makeGetRequest(undefined), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.getZaak).not.toHaveBeenCalled();
    });

    it("returns 401 when the token does not contain required claims (e.g. preferred_username absent on first load)", async () => {
      mockTokenService.getTokenInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.getZaak(makeGetRequest("Bearer incomplete.token"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.getZaak).not.toHaveBeenCalled();
    });

    it("returns 500 when the service throws an unexpected error", async () => {
      mockZaakService.getZaak.mockRejectedValue(new Error("unexpected failure"));

      await controller.getZaak(makeGetRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });
  });

  describe("addDocumentToZaak", () => {
    it("resolves userInfo from the authorization header and passes it to the service", async () => {
      const body = { titel: "doc.pdf", creatiedatum: "2025-01-15" };

      await controller.addDocumentToZaak(
        makePostRequest("Bearer valid.jwt", "ZAAK-001", body),
        mockReply,
      );

      expect(mockTokenService.getTokenInfo).toHaveBeenCalledWith("Bearer valid.jwt");
      expect(mockZaakService.addDocumentToZaak).toHaveBeenCalledWith(
        "ZAAK-001",
        mockTokenInfo,
        undefined,
        body,
      );
    });

    it("returns 200 with the created document returned by the service", async () => {
      const document = { url: "https://example.com/doc/1" };
      mockZaakService.addDocumentToZaak.mockResolvedValue(document);

      await controller.addDocumentToZaak(makePostRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(document);
    });

    it("returns 401 when the authorization header is missing", async () => {
      mockTokenService.getTokenInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.addDocumentToZaak(makePostRequest(undefined), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.addDocumentToZaak).not.toHaveBeenCalled();
    });

    it("returns 401 when the token does not contain required claims (e.g. preferred_username absent on first load)", async () => {
      mockTokenService.getTokenInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.addDocumentToZaak(makePostRequest("Bearer incomplete.token"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.addDocumentToZaak).not.toHaveBeenCalled();
    });

    it("returns 500 when the service throws an unexpected error", async () => {
      mockZaakService.addDocumentToZaak.mockRejectedValue(new Error("unexpected failure"));

      await controller.addDocumentToZaak(makePostRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });
  });
});
