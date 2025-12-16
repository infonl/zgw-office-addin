/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { useOffice } from "./useOffice";
import { clearToken } from "../utils/getAccessToken";

// Mock Office.js types
interface MockAsyncResult<T> {
  status: Office.AsyncResultStatus;
  value?: T;
  error?: { message: string };
}

interface MockFile {
  getSliceAsync: Mock;
  closeAsync: Mock;
  sliceCount: number;
}

interface MockFileProperties {
  url: string;
}

const mockOfficeContext = {
  host: 0 as Office.HostType,
  document: {
    getFilePropertiesAsync: vi.fn(),
    getFileAsync: vi.fn(),
  },
  mailbox: {
    item: {
      subject: "Test Email Subject",
      itemId: "test-item-id",
    },
  },
  ui: {
    closeContainer: vi.fn(),
  },
};

const mockOfficeAuth = {
  getAccessToken: vi.fn(),
};

const mockOfficeAddin = {
  hide: vi.fn(),
};

// Setup global Office mock
global.Office = {
  context: mockOfficeContext,
  auth: mockOfficeAuth,
  addin: mockOfficeAddin,
  HostType: {
    Word: 0,
    Excel: 1,
    Outlook: 2,
    PowerPoint: 3,
    Project: 4,
    Access: 5,
    Visio: 6,
    OneNote: 7,
  },
  AsyncResultStatus: {
    Succeeded: 0,
    Failed: 1,
  },
  FileType: {
    Compressed: 0,
    Pdf: 1,
    Text: 2,
  },
  onReady: vi.fn(),
} as unknown as typeof Office;

describe("useOffice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
    mockOfficeContext.host = Office.HostType.Word;
  });

  describe("Host detection", () => {
    it("should detect Word as host", () => {
      mockOfficeContext.host = Office.HostType.Word;
      const { result } = renderHook(() => useOffice());

      expect(result.current.host).toBe(Office.HostType.Word);
      expect(result.current.isWord).toBe(true);
      expect(result.current.isExcel).toBe(false);
      expect(result.current.isOutlook).toBe(false);
    });

    it("should detect Excel as host", () => {
      mockOfficeContext.host = Office.HostType.Excel;
      const { result } = renderHook(() => useOffice());

      expect(result.current.host).toBe(Office.HostType.Excel);
      expect(result.current.isWord).toBe(false);
      expect(result.current.isExcel).toBe(true);
      expect(result.current.isOutlook).toBe(false);
    });

    it("should detect Outlook as host", () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      const { result } = renderHook(() => useOffice());

      expect(result.current.host).toBe(Office.HostType.Outlook);
      expect(result.current.isWord).toBe(false);
      expect(result.current.isExcel).toBe(false);
      expect(result.current.isOutlook).toBe(true);
    });

    it("should handle PowerPoint host", () => {
      mockOfficeContext.host = Office.HostType.PowerPoint;
      const { result } = renderHook(() => useOffice());

      expect(result.current.host).toBe(Office.HostType.PowerPoint);
      expect(result.current.isWord).toBe(false);
      expect(result.current.isExcel).toBe(false);
      expect(result.current.isOutlook).toBe(false);
    });
  });

  describe("getFileName", () => {
    it("should return sanitized Word filename", async () => {
      mockOfficeContext.host = Office.HostType.Word;
      const mockFileName = "Test Document.docx";

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { url: `https://example.com/${mockFileName}` },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe(mockFileName);
    });

    it("should return sanitized Excel filename", async () => {
      mockOfficeContext.host = Office.HostType.Excel;
      const mockFileName = "Budget 2025.xlsx";

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { url: `https://example.com/documents/${mockFileName}` },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe(mockFileName);
    });

    it("should sanitize filename with invalid characters", async () => {
      mockOfficeContext.host = Office.HostType.Word;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { url: "https://example.com/Test:File*Name?.docx" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("Test File Name .docx");
      expect(fileName).not.toContain(":");
      expect(fileName).not.toContain("*");
      expect(fileName).not.toContain("?");
    });

    it("should return default Word filename on error", async () => {
      mockOfficeContext.host = Office.HostType.Word;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: { message: "Failed to get properties" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("document.docx");
    });

    it("should return default Excel filename on error", async () => {
      mockOfficeContext.host = Office.HostType.Excel;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: { message: "Failed to get properties" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("workbook.xlsx");
    });

    it("should return Outlook subject as .eml filename", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "Important Meeting Notes", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("Important Meeting Notes.eml");
    });

    it("should append .eml extension if not present", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "Weekly Report", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("Weekly Report.eml");
      expect(fileName.endsWith(".eml")).toBe(true);
    });

    it("should not double-append .eml extension", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "Already Has Extension.eml", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("Already Has Extension.eml");
      expect((fileName.match(/\.eml/g) || []).length).toBe(1);
    });

    it("should return default Outlook filename when no subject", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      expect(fileName).toBe("Outlook-bericht.eml");
    });

    it("should sanitize Outlook subject with invalid characters", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "RE: Invoice/Payment|Update", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getFileName();

      // ✅ Fixed: sanitizeFileName collapses multiple spaces to single space
      expect(fileName).toBe("RE Invoice Payment Update.eml");
      expect(fileName).not.toContain(":");
      expect(fileName).not.toContain("/");
      expect(fileName).not.toContain("|");
    });
  });

  describe("getDocumentFileName", () => {
    it("should return filename from Word document URL", async () => {
      mockOfficeContext.host = Office.HostType.Word;
      const mockFileName = "Contract-2025.docx";

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { url: `https://sharepoint.com/documents/${mockFileName}` },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getDocumentFileName();

      expect(fileName).toBe(mockFileName);
    });

    it("should return filename from Excel workbook URL", async () => {
      mockOfficeContext.host = Office.HostType.Excel;
      const mockFileName = "Sales-Data-Q4.xlsx";

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { url: `https://onedrive.com/files/${mockFileName}` },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getDocumentFileName();

      expect(fileName).toBe(mockFileName);
    });

    it("should reject when getFilePropertiesAsync fails", async () => {
      mockOfficeContext.host = Office.HostType.Word;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: { message: "Access denied" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());

      await expect(result.current.getDocumentFileName()).rejects.toThrow(
        "Unable to get file properties"
      );
    });

    it("should handle complex URL paths for Word", async () => {
      mockOfficeContext.host = Office.HostType.Word;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: {
              url: `https://tenant.sharepoint.com/sites/team/Shared%20Documents/Projects/2025/Report.docx`,
            },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getDocumentFileName();

      expect(fileName).toBe("Report.docx");
    });

    it("should handle complex URL paths for Excel", async () => {
      mockOfficeContext.host = Office.HostType.Excel;

      (mockOfficeContext.document.getFilePropertiesAsync as Mock).mockImplementation(
        (callback: (_result: MockAsyncResult<MockFileProperties>) => void) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: {
              url: `https://onedrive.live.com/personal/user_company_com/Documents/Data.xlsx`,
            },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const fileName = await result.current.getDocumentFileName();

      expect(fileName).toBe("Data.xlsx");
    });
  });

  describe("getOutlookSubject", () => {
    it("should return Outlook email subject", () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "Quarterly Review Meeting", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const subject = result.current.getOutlookSubject();

      expect(subject).toBe("Quarterly Review Meeting");
    });

    it("should return empty string when Outlook subject is missing", () => {
      mockOfficeContext.host = Office.HostType.Outlook;
      mockOfficeContext.mailbox = {
        item: { subject: "", itemId: "test-id" },
      };

      const { result } = renderHook(() => useOffice());
      const subject = result.current.getOutlookSubject();

      expect(subject).toBe("");
    });
  });

  describe("getSignedInUser", () => {
    it("should return user email from JWT token", async () => {
      const mockPayload = { preferred_username: "user@company.com", name: "Test User" };
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      (mockOfficeAuth.getAccessToken as Mock).mockResolvedValue(mockToken);

      const { result } = renderHook(() => useOffice());
      const user = await result.current.getSignedInUser();

      expect(user).toBe("user@company.com");
    });

    it("should fallback to name if preferred_username not available", async () => {
      const mockPayload = { name: "John Doe", sub: "user-id-123" };
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      (mockOfficeAuth.getAccessToken as Mock).mockResolvedValue(mockToken);

      const { result } = renderHook(() => useOffice());
      const user = await result.current.getSignedInUser();

      expect(user).toBe("John Doe");
    });

    it("should return null when authentication fails", async () => {
      (mockOfficeAuth.getAccessToken as Mock).mockRejectedValue(new Error("Authentication failed"));

      const { result } = renderHook(() => useOffice());
      const user = await result.current.getSignedInUser();

      expect(user).toBeNull();
    });

    it("should return null when token is malformed", async () => {
      (mockOfficeAuth.getAccessToken as Mock).mockResolvedValue("invalid-token");

      const { result } = renderHook(() => useOffice());
      const user = await result.current.getSignedInUser();

      expect(user).toBeNull();
    });
  });

  describe("getDocumentData", () => {
    it("should get Word document data successfully", async () => {
      mockOfficeContext.host = Office.HostType.Word;
      const mockData = new Uint8Array([80, 75, 3, 4]); // ZIP signature for .docx

      const mockFile: MockFile = {
        getSliceAsync: vi.fn((_index, callback) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { data: mockData, index: 0 },
          });
        }),
        closeAsync: vi.fn(),
        sliceCount: 1,
      };

      (mockOfficeContext.document.getFileAsync as Mock).mockImplementation(
        (_fileType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: mockFile,
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const data = await result.current.getDocumentData();

      expect(data).toBeTruthy();
      expect(typeof data).toBe("string");
      expect(mockFile.closeAsync).toHaveBeenCalled();
    });

    it("should get Excel document data successfully", async () => {
      mockOfficeContext.host = Office.HostType.Excel;
      const mockData = new Uint8Array([80, 75, 3, 4]); // ZIP signature for .xlsx

      const mockFile: MockFile = {
        getSliceAsync: vi.fn((_index, callback) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: { data: mockData, index: 0 },
          });
        }),
        closeAsync: vi.fn(),
        sliceCount: 1,
      };

      (mockOfficeContext.document.getFileAsync as Mock).mockImplementation(
        (_fileType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: mockFile,
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const data = await result.current.getDocumentData();

      expect(data).toBeTruthy();
      expect(typeof data).toBe("string");
      expect(mockFile.closeAsync).toHaveBeenCalled();
    });

    it("should return empty string for Outlook host", async () => {
      mockOfficeContext.host = Office.HostType.Outlook;

      const { result } = renderHook(() => useOffice());
      const data = await result.current.getDocumentData();

      expect(data).toBe("");
    });

    it("should return empty string when getFileAsync fails for Word", async () => {
      mockOfficeContext.host = Office.HostType.Word;

      (mockOfficeContext.document.getFileAsync as Mock).mockImplementation(
        (_fileType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: { message: "File access denied" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const data = await result.current.getDocumentData();

      expect(data).toBe("");
    });

    it("should return empty string when getFileAsync fails for Excel", async () => {
      mockOfficeContext.host = Office.HostType.Excel;

      (mockOfficeContext.document.getFileAsync as Mock).mockImplementation(
        (_fileType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: { message: "File access denied" },
          });
        }
      );

      const { result } = renderHook(() => useOffice());
      const data = await result.current.getDocumentData();

      expect(data).toBe("");
    });
  });
});
