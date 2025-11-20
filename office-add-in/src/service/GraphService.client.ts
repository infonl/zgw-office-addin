/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { LoggerService } from "../utils/LoggerService";

import type { GraphAuthProvider, GraphMessage } from "./GraphTypes";
import { ResponseType } from "@microsoft/microsoft-graph-client";

export class GraphServiceClient {
  private logger = LoggerService.withContext(this);
  private client: Client;

  constructor(authProvider: GraphAuthProvider) {
    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await authProvider.getAccessToken();
          this.logger.DEBUG("Token retrieved:", token ? token.substring(0, 20) + "..." : null);
          done(null, token);
        } catch (err) {
          this.logger.ERROR("Token retrieval failed:", err);
          done(err, null);
        }
      },
    });
    this.logger.DEBUG("Initialized");
  }

  async getMessage(graphId: string): Promise<GraphMessage> {
    const endpoint = `/me/messages/${encodeURIComponent(graphId)}`;
    this.logger.DEBUG("getMessage:", { graphId, endpoint });
    try {
      const result = await this.client.api(endpoint).get();
      this.logger.DEBUG("getMessage result:", result);
      return result;
    } catch (error) {
      this.logger.ERROR("getMessage error:", error);
      throw error;
    }
  }

  async getAttachmentContent(
    graphMessageId: string,
    graphAttachmentId: string
  ): Promise<ArrayBuffer> {
    const endpoint = `/me/messages/${encodeURIComponent(graphMessageId)}/attachments/${encodeURIComponent(graphAttachmentId)}/$value`;
    this.logger.DEBUG("getAttachmentContent:", {
      graphMessageId,
      graphAttachmentId,
      endpoint,
    });
    try {
      const response = await this.client.api(endpoint).responseType(ResponseType.ARRAYBUFFER).get();
      this.logger.DEBUG("getAttachmentContent result:", {
        size: response?.byteLength,
      });
      return response;
    } catch (error) {
      this.logger.ERROR("getAttachmentContent error:", error);
      throw error;
    }
  }

  async getEmailAsEML(graphId: string): Promise<string> {
    const endpoint = `/me/messages/${encodeURIComponent(graphId)}/$value`;
    this.logger.DEBUG("getEmailAsEML:", { graphId, endpoint });
    try {
      const response = await this.client.api(endpoint).responseType(ResponseType.TEXT).get();
      this.logger.DEBUG("getEmailAsEML result:", {
        length: response?.length,
      });
      return response;
    } catch (error) {
      this.logger.ERROR("getEmailAsEML error:", error);
      throw error;
    }
  }

  async officeIdsToGraphIdsViaApi(
    officeIds: string[],
    sourceIdType: "ewsId" | "entryId" = "ewsId"
  ): Promise<(string | null)[]> {
    const endpoint = "/me/translateExchangeIds";
    this.logger.DEBUG("officeIdsToGraphIdsViaApi:", {
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
        this.logger.DEBUG("officeIdsToGraphIdsViaApi result:", result.value);
        return result.value.map(
          (exchangeIdResult: { targetId?: string | null }) => exchangeIdResult.targetId || null
        );
      }
      this.logger.WARN("officeIdsToGraphIdsViaApi: no value in result");
      return officeIds.map(() => null);
    } catch (error) {
      this.logger.ERROR("officeIdsToGraphIdsViaApi error:", error);
      return officeIds.map(() => null);
    }
  }
}
