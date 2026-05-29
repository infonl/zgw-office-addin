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

const mockUserInfo = { preferredUsername: "test-user", name: "Test User" };

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
    resolveUserInfo: ReturnType<typeof vi.fn>;
    getZaak: ReturnType<typeof vi.fn>;
    addDocumentToZaak: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockZaakService = {
      resolveUserInfo: vi.fn().mockReturnValue(mockUserInfo),
      getZaak: vi.fn().mockResolvedValue({ identificatie: "ZAAK-001" }),
      addDocumentToZaak: vi.fn().mockResolvedValue({ url: "https://example.com/doc/1" }),
    };
    controller = new ZaakController(mockZaakService as unknown as ZaakService);
  });

  describe("getZaak", () => {
    it("resolves userInfo from the authorization header and passes it to the service", async () => {
      await controller.getZaak(makeGetRequest("Bearer valid.jwt"), mockReply);

      expect(mockZaakService.resolveUserInfo).toHaveBeenCalledWith("Bearer valid.jwt");
      expect(mockZaakService.getZaak).toHaveBeenCalledWith("ZAAK-001", mockUserInfo, undefined);
    });

    it("returns 200 with the zaak returned by the service", async () => {
      const zaak = { identificatie: "ZAAK-001", status: "open" };
      mockZaakService.getZaak.mockResolvedValue(zaak);

      await controller.getZaak(makeGetRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(zaak);
    });

    it("returns 401 when the authorization header is missing", async () => {
      mockZaakService.resolveUserInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.getZaak(makeGetRequest(undefined), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.getZaak).not.toHaveBeenCalled();
    });

    it("returns 401 when the token does not contain required claims (e.g. preferred_username absent on first load)", async () => {
      mockZaakService.resolveUserInfo.mockImplementation(() => {
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

      await controller.addDocumentToZaak(makePostRequest("Bearer valid.jwt", "ZAAK-001", body), mockReply);

      expect(mockZaakService.resolveUserInfo).toHaveBeenCalledWith("Bearer valid.jwt");
      expect(mockZaakService.addDocumentToZaak).toHaveBeenCalledWith("ZAAK-001", mockUserInfo, undefined, body);
    });

    it("returns 200 with the created document returned by the service", async () => {
      const document = { url: "https://example.com/doc/1" };
      mockZaakService.addDocumentToZaak.mockResolvedValue(document);

      await controller.addDocumentToZaak(makePostRequest("Bearer valid.jwt"), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(document);
    });

    it("returns 401 when the authorization header is missing", async () => {
      mockZaakService.resolveUserInfo.mockImplementation(() => {
        throw new Unauthorized();
      });

      await controller.addDocumentToZaak(makePostRequest(undefined), mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockZaakService.addDocumentToZaak).not.toHaveBeenCalled();
    });

    it("returns 401 when the token does not contain required claims (e.g. preferred_username absent on first load)", async () => {
      mockZaakService.resolveUserInfo.mockImplementation(() => {
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
