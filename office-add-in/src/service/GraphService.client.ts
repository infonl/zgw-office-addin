/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

import type { GraphAuthProvider, GraphMessage } from "./GraphTypes";
import { ResponseType } from "@microsoft/microsoft-graph-client";

export class GraphServiceClient {
  private client: Client;

  constructor(authProvider: GraphAuthProvider) {
    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await authProvider.getAccessToken();
          console.debug(
            "[GraphServiceClient] Token retrieved:",
            token ? token.substring(0, 20) + "..." : null
          );
          done(null, token);
        } catch (err) {
          console.error("[GraphServiceClient] Token retrieval failed:", err);
          done(err, null);
        }
      },
    });
    console.debug("[GraphServiceClient] Initialized");
  }

  async getMessage(graphId: string): Promise<GraphMessage> {
    const endpoint = `/me/messages/${encodeURIComponent(graphId)}`;
    console.debug("[GraphServiceClient] getMessage:", { graphId, endpoint });
    try {
      const result = await this.client.api(endpoint).get();
      console.debug("[GraphServiceClient] getMessage result:", result);
      return result;
    } catch (error) {
      console.error("[GraphServiceClient] getMessage error:", error);
      throw error;
    }
  }

  async getAttachmentContent(
    graphMessageId: string,
    graphAttachmentId: string
  ): Promise<ArrayBuffer> {
    const endpoint = `/me/messages/${encodeURIComponent(graphMessageId)}/attachments/${encodeURIComponent(graphAttachmentId)}/$value`;
    console.debug("[GraphServiceClient] getAttachmentContent:", {
      graphMessageId,
      graphAttachmentId,
      endpoint,
    });
    try {
      const response = await this.client.api(endpoint).responseType(ResponseType.ARRAYBUFFER).get();
      console.debug("[GraphServiceClient] getAttachmentContent result:", {
        size: response?.byteLength,
      });
      return response;
    } catch (error) {
      console.error("[GraphServiceClient] getAttachmentContent error:", error);
      throw error;
    }
  }

  async getEmailAsEML(graphId: string): Promise<string> {
    const endpoint = `/me/messages/${encodeURIComponent(graphId)}/$value`;
    console.debug("[GraphServiceClient] getEmailAsEML:", { graphId, endpoint });
    try {
      const response = await this.client.api(endpoint).responseType(ResponseType.TEXT).get();
      console.debug("[GraphServiceClient] getEmailAsEML result:", { length: response?.length });
      return response;
    } catch (error) {
      console.error("[GraphServiceClient] getEmailAsEML error:", error);
      throw error;
    }
  }

  async officeIdsToGraphIdsViaApi(
    officeIds: string[],
    sourceIdType: "ewsId" | "entryId" = "ewsId"
  ): Promise<(string | null)[]> {
    const endpoint = "/me/translateExchangeIds";
    console.debug("[GraphServiceClient] officeIdsToGraphIdsViaApi:", {
      officeIds,
      sourceIdType,
      endpoint,
    });
    try {
      const result = await this.client.api(endpoint).post({
        inputIds: officeIds,
        sourceIdType,
        targetIdType: "restId",
      });
      if (result.value && Array.isArray(result.value)) {
        console.debug("[GraphServiceClient] officeIdsToGraphIdsViaApi result:", result.value);
        return result.value.map(
          (exchangeIdResult: { targetId?: string | null }) => exchangeIdResult.targetId || null
        );
      }
      console.warn("[GraphServiceClient] officeIdsToGraphIdsViaApi: no value in result");
      return officeIds.map(() => null);
    } catch (error) {
      console.error("[GraphServiceClient] officeIdsToGraphIdsViaApi error:", error);
      return officeIds.map(() => null);
    }
  }
}
