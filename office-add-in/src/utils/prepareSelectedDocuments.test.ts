/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prepareSelectedDocuments } from "./prepareSelectedDocuments";
import { GraphService } from "../graph";
import type { SelectedDocument } from "../hooks/types";

const mockGraphService = { officeIdsToGraphIdsViaApi: vi.fn() };

const mockDocument = (id: string): SelectedDocument =>
  ({
    selected: true,
    attachment: { id },
    vertrouwelijkheidaanduiding: "openbaar",
    informatieobjecttype: "http://example.com/type",
    status: "in_bewerking",
    creatiedatum: new Date(),
    zaakidentificatie: "ZAAK-001",
    auteur: "Test User",
  }) as SelectedDocument;

const mockEmailObject = (itemId: string): Office.MessageRead => ({ itemId }) as Office.MessageRead;

describe("prepareSelectedDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array if no selectedDocuments and no email", async () => {
    const emptyEmail = {} as Office.MessageRead;
    const result = await prepareSelectedDocuments(
      [],
      emptyEmail,
      mockGraphService as unknown as GraphService
    );
    expect(result).toEqual([]);
    expect(mockGraphService.officeIdsToGraphIdsViaApi).not.toHaveBeenCalled();
  });

  it("handles only email with no attachments", async () => {
    const emailId = "mocked-email-id";
    mockGraphService.officeIdsToGraphIdsViaApi.mockResolvedValueOnce(["graph-mocked-email-id"]);
    const docs = [mockDocument("EmailItself-mocked-email-id")];
    const email = mockEmailObject(emailId);

    const result = await prepareSelectedDocuments(
      docs,
      email,
      mockGraphService as unknown as GraphService
    );
    expect(mockGraphService.officeIdsToGraphIdsViaApi).toHaveBeenCalledWith([emailId]);
    expect(result).toEqual([
      {
        ...docs[0],
        graphId: "graph-mocked-email-id",
        parentEmailGraphId: null, // Email itself never has a parent
      },
    ]);
  });

  it("handles email and attachments", async () => {
    const emailId = "mocked-email-id";
    const attachmentId1 = "mocked-attachment-1";
    const attachmentId2 = "mocked-attachment-2";
    mockGraphService.officeIdsToGraphIdsViaApi.mockResolvedValueOnce([
      "graph-mocked-email-id",
      "graph-mocked-attachment-1",
      "graph-mocked-attachment-2",
    ]);
    const email = mockEmailObject(emailId);
    const docs = [
      mockDocument("EmailItself-mocked-email-id"),
      mockDocument(attachmentId1),
      mockDocument(attachmentId2),
    ];

    const result = await prepareSelectedDocuments(
      docs,
      email,
      mockGraphService as unknown as GraphService
    );
    expect(mockGraphService.officeIdsToGraphIdsViaApi).toHaveBeenCalledWith([
      emailId,
      attachmentId1,
      attachmentId2,
    ]);
    expect(result).toEqual([
      {
        ...docs[0],
        graphId: "graph-mocked-email-id",
        parentEmailGraphId: null,
      },
      {
        ...docs[1],
        graphId: "graph-mocked-attachment-1",
        parentEmailGraphId: "graph-mocked-email-id",
      },
      {
        ...docs[2],
        graphId: "graph-mocked-attachment-2",
        parentEmailGraphId: "graph-mocked-email-id",
      },
    ]);
  });

  it("handles attachments with some returned graph IDs being null", async () => {
    const emailId = "mocked-email-id";
    const attachmentId1 = "mocked-attachment-1";
    const attachmentId2 = "mocked-attachment-2";
    mockGraphService.officeIdsToGraphIdsViaApi.mockResolvedValueOnce([
      "graph-mocked-email-id",
      null,
      "graph-mocked-attachment-2",
    ]);
    const email = mockEmailObject(emailId);
    const docs = [
      mockDocument("EmailItself-mocked-email-id"),
      mockDocument(attachmentId1),
      mockDocument(attachmentId2),
    ];

    const result = await prepareSelectedDocuments(
      docs,
      email,
      mockGraphService as unknown as GraphService
    );
    expect(result).toEqual([
      {
        ...docs[0],
        graphId: "graph-mocked-email-id",
        parentEmailGraphId: null,
      },
      {
        ...docs[1],
        graphId: null,
        parentEmailGraphId: "graph-mocked-email-id",
      },
      {
        ...docs[2],
        graphId: "graph-mocked-attachment-2",
        parentEmailGraphId: "graph-mocked-email-id",
      },
    ]);
  });

  it("handles only attachments, email not selected", async () => {
    const emailId = "mocked-email-id";
    const attachmentId1 = "mocked-attachment-1";
    const attachmentId2 = "mocked-attachment-2";
    mockGraphService.officeIdsToGraphIdsViaApi.mockResolvedValueOnce([
      "graph-mocked-email-id",
      "graph-mocked-attachment-1",
      "graph-mocked-attachment-2",
    ]);
    const docs = [mockDocument(attachmentId1), mockDocument(attachmentId2)]; // no email
    const email = mockEmailObject(emailId);

    const result = await prepareSelectedDocuments(
      docs,
      email,
      mockGraphService as unknown as GraphService
    );
    expect(mockGraphService.officeIdsToGraphIdsViaApi).toHaveBeenCalledWith([
      emailId,
      attachmentId1,
      attachmentId2,
    ]);

    expect(result).toEqual([
      {
        ...docs[0],
        graphId: "graph-mocked-attachment-1",
        parentEmailGraphId: "graph-mocked-email-id",
      },
      {
        ...docs[1],
        graphId: "graph-mocked-attachment-2",
        parentEmailGraphId: "graph-mocked-email-id",
      },
    ]);
  });
});
