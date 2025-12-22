/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { ZaakService } from "./ZaakService";
import { ZaakNotFound } from "../exception/ZaakNotFound";
import { FileNotSupported } from "../exception/FileNotSupported";
import { LoggerService } from "./LoggerService";
import type { HttpService } from "./HttpService";

// Mock LoggerService
vi.mock("./LoggerService", () => ({
  LoggerService: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUserInfo = {
  preferedUsername: "test-user",
  name: "Test User",
};

describe("ZaakService", () => {
  let zaakService: ZaakService;
  let mockHttpService: {
    GET: MockedFunction<HttpService["GET"]>;
    POST: MockedFunction<HttpService["POST"]>;
  };

  beforeEach(() => {
    mockHttpService = {
      GET: vi.fn(),
      POST: vi.fn(),
    };
    zaakService = new ZaakService(mockHttpService as unknown as HttpService);
    vi.clearAllMocks();
  });

  describe("getZaak", () => {
    const mockZaak = {
      url: "https://api.example.com/zaken/123",
      identificatie: "ZAAK-001",
      bronorganisatie: "123456789",
      zaaktype: "https://api.example.com/zaaktypen/1",
      status: "https://api.example.com/statussen/1",
    };

    const mockZaaktype = {
      url: "https://api.example.com/zaaktypen/1",
      omschrijving: "Test Zaaktype",
      informatieobjecttypen: [
        "https://api.example.com/informatieobjecttypen/1",
        "https://api.example.com/informatieobjecttypen/2",
      ],
    };

    const mockStatus = {
      url: "https://api.example.com/statussen/1",
      statustoelichting: "In behandeling",
    };

    const mockInformatieobjecttypen = [
      {
        omschrijving: "Document type 1",
        vertrouwelijkheidaanduiding: "openbaar",
      },
      {
        omschrijving: "Document type 2",
        vertrouwelijkheidaanduiding: "vertrouwelijk",
      },
    ];

    it("should return a complete zaak with all related data", async () => {
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] }) // getZaakFromOpenZaak
        .mockResolvedValueOnce(mockZaaktype) // zaaktype
        .mockResolvedValueOnce(mockStatus) // status
        .mockResolvedValueOnce(mockInformatieobjecttypen[0]) // first informatieobjecttype
        .mockResolvedValueOnce(mockInformatieobjecttypen[1]); // second informatieobjecttype

      const result = await zaakService.getZaak("ZAAK-001");

      expect(result).toEqual({
        ...mockZaak,
        status: mockStatus,
        zaakinformatieobjecten: [
          {
            omschrijving: "Document type 1",
            vertrouwelijkheidaanduiding: "openbaar",
            url: "https://api.example.com/informatieobjecttypen/1",
          },
          {
            omschrijving: "Document type 2",
            vertrouwelijkheidaanduiding: "vertrouwelijk",
            url: "https://api.example.com/informatieobjecttypen/2",
          },
        ],
        zaaktype: mockZaaktype,
      });

      expect(mockHttpService.GET).toHaveBeenCalledTimes(5);
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(1, "/zaken/api/v1/zaken", {
        identificatie: "ZAAK-001",
      });
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(2, mockZaak.zaaktype);
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(3, mockZaak.status);
    });

    it("should handle zaak without status", async () => {
      const zaakWithoutStatus = { ...mockZaak, status: null };

      mockHttpService.GET.mockResolvedValueOnce({ results: [zaakWithoutStatus] })
        .mockResolvedValueOnce(mockZaaktype)
        .mockResolvedValueOnce(mockInformatieobjecttypen[0])
        .mockResolvedValueOnce(mockInformatieobjecttypen[1]);

      const result = await zaakService.getZaak("ZAAK-001");

      expect(result.status).toEqual({ statustoelichting: "-" });
      expect(mockHttpService.GET).toHaveBeenCalledTimes(4); // No status call
    });

    it("should include vertrouwelijkheidaanduiding in zaakinformatieobjecten", async () => {
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] })
        .mockResolvedValueOnce(mockZaaktype)
        .mockResolvedValueOnce(mockStatus)
        .mockResolvedValueOnce(mockInformatieobjecttypen[0])
        .mockResolvedValueOnce(mockInformatieobjecttypen[1]);

      const result = await zaakService.getZaak("ZAAK-001");

      expect(result.zaakinformatieobjecten).toHaveLength(2);
      expect(result.zaakinformatieobjecten[0]).toEqual({
        omschrijving: "Document type 1",
        vertrouwelijkheidaanduiding: "openbaar",
        url: "https://api.example.com/informatieobjecttypen/1",
      });
      expect(result.zaakinformatieobjecten[1]).toEqual({
        omschrijving: "Document type 2",
        vertrouwelijkheidaanduiding: "vertrouwelijk",
        url: "https://api.example.com/informatieobjecttypen/2",
      });
    });

    it("should throw ZaakNotFound when zaak does not exist", async () => {
      mockHttpService.GET.mockResolvedValueOnce({ results: [] });

      await expect(zaakService.getZaak("NONEXISTENT")).rejects.toThrow(ZaakNotFound);

      // Reset mock for second call
      mockHttpService.GET.mockResolvedValueOnce({ results: [] });
      await expect(zaakService.getZaak("NONEXISTENT")).rejects.toThrow(
        "Geen zaak gevonden voor zaaknummer: NONEXISTENT",
      );
    });

    it("should propagate HTTP errors", async () => {
      const httpError = new Error("HTTP error! status: 500");
      mockHttpService.GET.mockRejectedValueOnce(httpError);

      await expect(zaakService.getZaak("ZAAK-001")).rejects.toThrow(httpError);
    });
  });

  describe("addDocumentToZaak", () => {
    const mockZaak = {
      url: "https://api.example.com/zaken/123",
      identificatie: "ZAAK-001",
      bronorganisatie: "123456789",
    };

    const mockInformatieobject = {
      url: "https://api.example.com/documenten/456",
      titel: "test-document.docx",
    };

    const documentBody = {
      titel: "test-document.docx",
      creatiedatum: "2025-01-15",
      inhoud: "base64content",
      userInfo: mockUserInfo,
    };

    beforeEach(() => {
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });
    });

    it("should successfully add a document to zaak", async () => {
      mockHttpService.POST.mockResolvedValueOnce(mockInformatieobject) // create document
        .mockResolvedValueOnce({}) // create gebruiksrechten
        .mockResolvedValueOnce({}); // link document to zaak

      const result = await zaakService.addDocumentToZaak("ZAAK-001", documentBody);

      expect(result).toEqual(mockInformatieobject);

      // Verify document creation
      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        JSON.stringify({
          ...documentBody,
          bronorganisatie: mockZaak.bronorganisatie,
          formaat: "application/msword",
          taal: "dut",
          bestandsnaam: documentBody.titel,
          creatiedatum: "2025-01-15",
        }),
        mockUserInfo,
      );

      // Verify gebruiksrechten creation
      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        2,
        "/documenten/api/v1/gebruiksrechten",
        JSON.stringify({
          informatieobject: mockInformatieobject.url,
          startdatum: new Date("2025-01-15"),
          omschrijvingVoorwaarden: "geen",
        }),
        mockUserInfo,
      );

      // Verify document linking to zaak
      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        3,
        "/zaken/api/v1/zaakinformatieobjecten",
        JSON.stringify({
          informatieobject: mockInformatieobject.url,
          zaak: mockZaak.url,
        }),
        mockUserInfo,
      );

      expect(LoggerService.debug).toHaveBeenCalledWith("creating document", "ZAAK-001");
    });

    it.each([
      { extension: "doc", expectedFormat: "application/msword" },
      { extension: "docx", expectedFormat: "application/msword" },
      { extension: "xls", expectedFormat: "application/vnd.ms-excel" },
      {
        extension: "xlsx",
        expectedFormat: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { extension: "eml", expectedFormat: "message/rfc822" },
      { extension: "pdf", expectedFormat: "application/pdf" },
      { extension: "txt", expectedFormat: "text/plain" },
      { extension: "png", expectedFormat: "image/png" },
      { extension: "jpg", expectedFormat: "image/jpeg" },
      { extension: "jpeg", expectedFormat: "image/jpeg" },
    ])("should handle .$extension files", async ({ extension, expectedFormat }) => {
      const body = { ...documentBody, titel: `test-document.${extension}` };
      mockHttpService.POST.mockResolvedValue(mockInformatieobject);

      await zaakService.addDocumentToZaak("ZAAK-001", body);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.stringContaining(`"formaat":"${expectedFormat}"`),
        mockUserInfo,
      );
    });

    it("should throw FileNotSupported for unsupported file types", async () => {
      const unsupportedBody = { ...documentBody, titel: "test-document.xyz" };

      await expect(zaakService.addDocumentToZaak("ZAAK-001", unsupportedBody)).rejects.toThrow(
        FileNotSupported,
      );

      // Reset mock for second call
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });
      await expect(zaakService.addDocumentToZaak("ZAAK-001", unsupportedBody)).rejects.toThrow(
        "Bestand wordt niet ondersteund: test-document.xyz",
      );
    });

    it("should throw ZaakNotFound when zaak does not exist", async () => {
      mockHttpService.GET.mockReset().mockResolvedValueOnce({ results: [] });

      await expect(zaakService.addDocumentToZaak("NONEXISTENT", documentBody)).rejects.toThrow(
        ZaakNotFound,
      );
    });

    it("should handle empty body parameter", async () => {
      const bodyWithDefaults = {
        titel: "default.docx",
        creatiedatum: "2025-01-15",
        userInfo: mockUserInfo,
      };
      mockHttpService.POST.mockResolvedValue(mockInformatieobject);

      await zaakService.addDocumentToZaak("ZAAK-001", bodyWithDefaults);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.stringContaining('"bronorganisatie":"123456789"'),
        mockUserInfo,
      );
    });
  });

  describe("getFileFormat (private method testing via addDocumentToZaak)", () => {
    const mockZaak = {
      url: "https://api.example.com/zaken/123",
      identificatie: "ZAAK-001",
      bronorganisatie: "123456789",
    };

    beforeEach(() => {
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });
      mockHttpService.POST.mockResolvedValue({ url: "test" });
    });

    it("should return correct format for .docx files", async () => {
      await zaakService.addDocumentToZaak("ZAAK-001", {
        titel: "test.docx",
        creatiedatum: "2025-01-15",
        userInfo: mockUserInfo,
      });

      expect(mockHttpService.POST).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"formaat":"application/msword"'),
        mockUserInfo,
      );
    });

    it("should return correct format for .doc files", async () => {
      // Reset mock for this test
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });

      await zaakService.addDocumentToZaak("ZAAK-001", {
        titel: "test.doc",
        creatiedatum: "2025-01-15",
        userInfo: mockUserInfo,
      });

      expect(mockHttpService.POST).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"formaat":"application/msword"'),
        mockUserInfo,
      );
    });

    it("should throw FileNotSupported for unsupported extensions", async () => {
      // Reset mock for this test
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });

      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", {
          titel: "test.xyz",
          creatiedatum: "2025-01-15",
        }),
      ).rejects.toThrow(FileNotSupported);
    });

    it("should handle files without extension", async () => {
      // Reset mock for this test
      mockHttpService.GET.mockResolvedValueOnce({ results: [mockZaak] });

      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", { titel: "test", creatiedatum: "2025-01-15" }),
      ).rejects.toThrow(FileNotSupported);
    });
  });
});
