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

vi.mock("./LoggerService", () => ({
  LoggerService: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid-1234"),
}));

const mockUserInfo = {
  preferredUsername: "test-user",
  name: "Test User",
  uti: "test-uti-value",
};

const GET_HEADERS = {
  "X-NLX-Logrecord-ID": "test-uti-value",
  "X-Audit-Toelichting": "Zoek een zaak vanuit ZGW Office Add-in",
};

const POST_HEADERS = {
  "X-NLX-Logrecord-ID": "test-uti-value",
  "X-Audit-Toelichting": "Document toevoegen vanuit ZGW Office Add-in",
};

describe("ZaakService", () => {
  let zaakService: ZaakService;
  let mockHttpService: {
    GET: MockedFunction<HttpService["GET"]>;
    POST: MockedFunction<HttpService["POST"]>;
  };

  beforeEach(() => {
    const defaultGet: HttpService["GET"] = async <T>(
      _url: string,
      _userInfo: { preferredUsername: string; name: string },
      _params?: Record<string, string>,
      _headers: HeadersInit = {},
    ) => ({}) as T;

    const defaultPost: HttpService["POST"] = async <T>(
      _url: string,
      _body: BodyInit,
      _userInfo: { preferredUsername: string; name: string },
      _headers: HeadersInit = {},
    ) => ({}) as T;

    mockHttpService = {
      GET: vi.fn(defaultGet) as MockedFunction<HttpService["GET"]>,
      POST: vi.fn(defaultPost) as MockedFunction<HttpService["POST"]>,
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
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      )
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockZaaktype))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockStatus))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[1]));

      const result = await zaakService.getZaak("ZAAK-001", mockUserInfo);

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
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        1,
        "/zaken/api/v1/zaken",
        mockUserInfo,
        { identificatie: "ZAAK-001" },
        GET_HEADERS,
      );
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        2,
        mockZaak.zaaktype,
        mockUserInfo,
        undefined,
        GET_HEADERS,
      );
      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        3,
        mockZaak.status,
        mockUserInfo,
        undefined,
        GET_HEADERS,
      );
    });

    it("should handle zaak without status", async () => {
      const zaakWithoutStatus = { ...mockZaak, status: null };

      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [zaakWithoutStatus] }),
      )
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockZaaktype))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[1]));

      const result = await zaakService.getZaak("ZAAK-001", mockUserInfo);

      expect(result.status).toEqual({ statustoelichting: "-" });
      expect(mockHttpService.GET).toHaveBeenCalledTimes(4);
    });

    it("should include vertrouwelijkheidaanduiding in zaakinformatieobjecten", async () => {
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      )
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockZaaktype))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockStatus))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce((_url, _userInfo) => Promise.resolve(mockInformatieobjecttypen[1]));

      const result = await zaakService.getZaak("ZAAK-001", mockUserInfo);

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
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [] }),
      );

      await expect(zaakService.getZaak("NONEXISTENT", mockUserInfo)).rejects.toThrow(ZaakNotFound);

      mockHttpService.GET.mockResolvedValueOnce({ results: [] });
      await expect(zaakService.getZaak("NONEXISTENT", mockUserInfo)).rejects.toThrow(
        "Geen zaak gevonden voor zaaknummer: NONEXISTENT",
      );
    });

    it("uses correlationId as X-NLX-Logrecord-ID when provided", async () => {
      mockHttpService.GET.mockImplementation(() => Promise.resolve({ results: [mockZaak] }))
        .mockImplementationOnce(() => Promise.resolve({ results: [mockZaak] }))
        .mockImplementationOnce(() => Promise.resolve(mockZaaktype))
        .mockImplementationOnce(() => Promise.resolve(mockStatus))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[1]));

      await zaakService.getZaak("ZAAK-001", mockUserInfo, "office-correlation-id");

      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        1,
        "/zaken/api/v1/zaken",
        mockUserInfo,
        { identificatie: "ZAAK-001" },
        expect.objectContaining({ "X-NLX-Logrecord-ID": "office-correlation-id" }),
      );
    });

    it("falls back to uti when correlationId is absent", async () => {
      mockHttpService.GET.mockImplementationOnce(() => Promise.resolve({ results: [mockZaak] }))
        .mockImplementationOnce(() => Promise.resolve(mockZaaktype))
        .mockImplementationOnce(() => Promise.resolve(mockStatus))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[1]));

      await zaakService.getZaak("ZAAK-001", mockUserInfo, undefined);

      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        1,
        "/zaken/api/v1/zaken",
        mockUserInfo,
        { identificatie: "ZAAK-001" },
        expect.objectContaining({ "X-NLX-Logrecord-ID": mockUserInfo.uti }),
      );
    });

    it("falls back to randomUUID when both correlationId and uti are absent", async () => {
      const userWithoutUti = { preferredUsername: "test-user", name: "Test User" };
      mockHttpService.GET.mockImplementationOnce(() => Promise.resolve({ results: [mockZaak] }))
        .mockImplementationOnce(() => Promise.resolve(mockZaaktype))
        .mockImplementationOnce(() => Promise.resolve(mockStatus))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[0]))
        .mockImplementationOnce(() => Promise.resolve(mockInformatieobjecttypen[1]));

      await zaakService.getZaak("ZAAK-001", userWithoutUti);

      expect(mockHttpService.GET).toHaveBeenNthCalledWith(
        1,
        "/zaken/api/v1/zaken",
        userWithoutUti,
        { identificatie: "ZAAK-001" },
        expect.objectContaining({ "X-NLX-Logrecord-ID": "test-uuid-1234" }),
      );
    });

    it("should propagate HTTP errors", async () => {
      const httpError = new Error("HTTP error! status: 500");
      mockHttpService.GET.mockImplementationOnce(() => Promise.reject(httpError));

      await expect(zaakService.getZaak("ZAAK-001", mockUserInfo)).rejects.toThrow(httpError);
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
    };

    beforeEach(() => {
      mockHttpService.GET.mockImplementationOnce(
        <T>(
          _url: string,
          _userInfo: { preferredUsername: string; name: string },
          _params?: Record<string, string>,
          _headers: HeadersInit = {},
        ) => Promise.resolve({ results: [mockZaak] } as T),
      );
    });

    it("should successfully add a document to zaak", async () => {
      mockHttpService.POST.mockImplementationOnce((_url, _body, _userInfo) =>
        Promise.resolve(mockInformatieobject),
      )
        .mockImplementationOnce((_url, _body, _userInfo) => Promise.resolve({}))
        .mockImplementationOnce((_url, _body, _userInfo) => Promise.resolve({}));

      const result = await zaakService.addDocumentToZaak(
        "ZAAK-001",
        mockUserInfo,
        undefined,
        documentBody,
      );

      expect(result).toEqual(mockInformatieobject);

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
        POST_HEADERS,
      );

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        2,
        "/documenten/api/v1/gebruiksrechten",
        JSON.stringify({
          informatieobject: mockInformatieobject.url,
          startdatum: new Date("2025-01-15"),
          omschrijvingVoorwaarden: "geen",
        }),
        mockUserInfo,
        POST_HEADERS,
      );

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        3,
        "/zaken/api/v1/zaakinformatieobjecten",
        JSON.stringify({
          informatieobject: mockInformatieobject.url,
          zaak: mockZaak.url,
        }),
        mockUserInfo,
        POST_HEADERS,
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
      mockHttpService.POST.mockImplementation((_url, _body, _userInfo) =>
        Promise.resolve(mockInformatieobject),
      );

      await zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, body);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.stringContaining(`"formaat":"${expectedFormat}"`),
        mockUserInfo,
        POST_HEADERS,
      );
    });

    it("should throw FileNotSupported for unsupported file types", async () => {
      const unsupportedBody = { ...documentBody, titel: "test-document.xyz" };

      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, unsupportedBody),
      ).rejects.toThrow(FileNotSupported);

      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      );
      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, unsupportedBody),
      ).rejects.toThrow("Bestand wordt niet ondersteund: test-document.xyz");
    });

    it("should throw ZaakNotFound when zaak does not exist", async () => {
      mockHttpService.GET.mockReset().mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [] }),
      );

      await expect(
        zaakService.addDocumentToZaak("NONEXISTENT", mockUserInfo, undefined, documentBody),
      ).rejects.toThrow(ZaakNotFound);
    });

    it("should handle empty body parameter", async () => {
      const bodyWithDefaults = {
        titel: "default.docx",
        creatiedatum: "2025-01-15",
      };
      mockHttpService.POST.mockImplementation((_url, _body, _userInfo) =>
        Promise.resolve(mockInformatieobject),
      );

      await zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, bodyWithDefaults);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.stringContaining('"bronorganisatie":"123456789"'),
        mockUserInfo,
        POST_HEADERS,
      );
    });

    it("uses correlationId as X-NLX-Logrecord-ID when provided", async () => {
      mockHttpService.POST.mockResolvedValue(mockInformatieobject);

      await zaakService.addDocumentToZaak(
        "ZAAK-001",
        mockUserInfo,
        "office-correlation-id",
        documentBody,
      );

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.any(String),
        mockUserInfo,
        expect.objectContaining({ "X-NLX-Logrecord-ID": "office-correlation-id" }),
      );
    });

    it("falls back to uti when correlationId is absent", async () => {
      mockHttpService.POST.mockResolvedValue(mockInformatieobject);

      await zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, documentBody);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.any(String),
        mockUserInfo,
        expect.objectContaining({ "X-NLX-Logrecord-ID": mockUserInfo.uti }),
      );
    });

    it("falls back to randomUUID when both correlationId and uti are absent", async () => {
      const userWithoutUti = { preferredUsername: "test-user", name: "Test User" };
      mockHttpService.GET.mockReset().mockImplementationOnce(
        <T>(_url: string, _userInfo: unknown, _params?: unknown, _headers: HeadersInit = {}) =>
          Promise.resolve({ results: [mockZaak] } as T),
      );
      mockHttpService.POST.mockResolvedValue(mockInformatieobject);

      await zaakService.addDocumentToZaak("ZAAK-001", userWithoutUti, undefined, documentBody);

      expect(mockHttpService.POST).toHaveBeenNthCalledWith(
        1,
        "/documenten/api/v1/enkelvoudiginformatieobjecten",
        expect.any(String),
        userWithoutUti,
        expect.objectContaining({ "X-NLX-Logrecord-ID": "test-uuid-1234" }),
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
      mockHttpService.GET.mockImplementationOnce(
        <T>(
          _url: string,
          _userInfo: { preferredUsername: string; name: string },
          _params?: Record<string, string>,
          _headers: HeadersInit = {},
        ) => Promise.resolve({ results: [mockZaak] } as T),
      );
      mockHttpService.POST.mockImplementation(
        <T>(
          _url: string,
          _body: BodyInit,
          _userInfo: { preferredUsername: string; name: string },
          _headers: HeadersInit = {},
        ) => Promise.resolve({ url: "test" } as T),
      );
    });

    it("should return correct format for .docx files", async () => {
      await zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, {
        titel: "test.docx",
        creatiedatum: "2025-01-15",
      });

      expect(mockHttpService.POST).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"formaat":"application/msword"'),
        mockUserInfo,
        POST_HEADERS,
      );
    });

    it("should return correct format for .doc files", async () => {
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      );

      await zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, {
        titel: "test.doc",
        creatiedatum: "2025-01-15",
      });

      expect(mockHttpService.POST).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"formaat":"application/msword"'),
        mockUserInfo,
        POST_HEADERS,
      );
    });

    it("should throw FileNotSupported for unsupported extensions", async () => {
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      );

      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, {
          titel: "test.xyz",
          creatiedatum: "2025-01-15",
        }),
      ).rejects.toThrow(FileNotSupported);
    });

    it("should handle files without extension", async () => {
      mockHttpService.GET.mockImplementationOnce((_url, _userInfo, _params) =>
        Promise.resolve({ results: [mockZaak] }),
      );

      await expect(
        zaakService.addDocumentToZaak("ZAAK-001", mockUserInfo, undefined, {
          titel: "test",
          creatiedatum: "2025-01-15",
        }),
      ).rejects.toThrow(FileNotSupported);
    });
  });
});
