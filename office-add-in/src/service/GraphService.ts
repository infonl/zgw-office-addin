/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphApiError, retryWithAdaptiveBackoff } from "../utils/retryWithBackoff";

interface JwtClaims {
  aud?: string;
  scp?: string;
  roles?: string[];
  tid?: string;
  oid?: string;
  appid?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

interface ExchangeIdResult {
  targetId?: string | null;
}

function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export interface GraphAuthProvider {
  getAccessToken(): Promise<string>;
}

export interface GraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline?: boolean;
  contentBytes?: string; // Base64 encoded content for small attachments
}

export interface GraphMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  hasAttachments: boolean;
  attachments?: GraphAttachment[];
}

/**
 * Microsoft Graph API service for Office Add-ins
 * Handles authentication, rate limiting, and file operations
 */
export class GraphService {
  private readonly baseUrl = "https://graph.microsoft.com/v1.0";
  private authProvider: GraphAuthProvider;

  constructor(authProvider: GraphAuthProvider) {
    this.authProvider = authProvider;
  }

  /**
   * Performs authenticated HTTP request to Microsoft Graph API with retry logic
   * Includes special handling for authentication failures
   */
  private async graphRequest<ResponseType>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ResponseType> {
    return retryWithAdaptiveBackoff(async () => {
      const token = await this.authProvider.getAccessToken();
      const claims = decodeJwtClaims(token);
      try {
        console.debug("🔐 [Graph] token claims", {
          aud: claims && claims.aud,
          scp: claims && claims.scp,
          roles: claims && claims.roles,
          tid: claims && claims.tid,
          oid: claims && claims.oid,
          appid: claims && claims.appid,
          iat: claims && claims.iat,
          exp: claims && claims.exp,
        });
      } catch (error) {
        console.debug("GraphService: caught error (ignored)", error);
      }
      console.debug("➡️ [Graph] request", {
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || "GET",
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const retryAfter = response.headers.get("Retry-After");
        let errorBody: string | object | null = null;
        try {
          const clone = response.clone();
          const text = await clone.text();
          try {
            errorBody = JSON.parse(text);
          } catch {
            errorBody = text;
          }
        } catch (error) {
          console.debug("GraphService: caught error (ignored)", error);
        }

        console.error("⛔ [Graph] response error", {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorBody,
        });

        if (response.status === 401 || response.status === 403) {
          throw new GraphApiError(
            response.status,
            `Authentication/Authorization failed: ${response.statusText} — details: ${typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody)}`,
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }

        throw new GraphApiError(
          response.status,
          `Graph API error: ${response.statusText} — details: ${typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody)}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      console.debug("✅ [Graph] response ok", { endpoint, status: response.status });
      return response.json();
    });
  }

  /**
   * Gets the current user's email message by Graph ID
   */
  async getMessage(graphId: string): Promise<GraphMessage> {
    const encodedId = encodeURIComponent(graphId);
    console.debug("[GraphService] getMessage: graphId=", graphId, "encodedId=", encodedId);
    return this.graphRequest<GraphMessage>(`/me/messages/${encodedId}`);
  }

  /**
   * Gets specific attachment content from an email message by Graph IDs
   * Returns the raw binary content as an ArrayBuffer (no base64 encoding).
   */
  async getAttachmentContent(
    graphMessageId: string,
    graphAttachmentId: string
  ): Promise<ArrayBuffer> {
    return retryWithAdaptiveBackoff(async () => {
      const encodedMessageId = encodeURIComponent(graphMessageId);
      const encodedAttachmentId = encodeURIComponent(graphAttachmentId);

      const token = await this.authProvider.getAccessToken();
      const url = `${this.baseUrl}/me/messages/${encodedMessageId}/attachments/${encodedAttachmentId}/$value`;
      console.debug("[GraphService] getAttachmentContent: url=", url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const retryAfter = response.headers.get("Retry-After");
        throw new GraphApiError(
          response.status,
          `Failed to download attachment ${graphAttachmentId} from message ${graphMessageId}: ${response.statusText}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    });
  }

  /**
   * Gets the raw email content as EML (plain text) by Graph ID
   * Returns the EML string; backend is responsible for any base64 encoding.
   */
  async getEmailAsEML(graphId: string): Promise<string> {
    return retryWithAdaptiveBackoff(async () => {
      const encodedId = encodeURIComponent(graphId);
      const token = await this.authProvider.getAccessToken();
      const url = `${this.baseUrl}/me/messages/${encodedId}/$value`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const retryAfter = response.headers.get("Retry-After");
        let details = "";
        try {
          const responseText = await response.clone().text();
          details = responseText;
        } catch (error) {
          console.debug("GraphService: caught error (ignored)", error);
        }
        throw new GraphApiError(
          response.status,
          `Failed to download email from /me/messages/${graphId}/$value: ${response.statusText} — ${details}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      console.debug("✅ [Graph] EML fetched", { graphId });
      return response.text(); // EML in plain text format as string, encoding base 64 will be handled by backend
    });
  }

  /**
   * Converts a list of Office itemIds (messages, attachments) to Graph REST IDs using the official Graph API
   */
  async officeIdsToGraphIdsViaApi(
    officeIds: string[],
    sourceIdType: "ewsId" | "entryId" = "ewsId"
  ): Promise<(string | null)[]> {
    const token = await this.authProvider.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/me/translateExchangeIds`;
    const body = {
      inputIds: officeIds,
      sourceIdType,
      targetIdType: "restId",
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("[GraphService] translateExchangeIds batch error", await response.text());
      return officeIds.map(() => null);
    }
    const result = await response.json();
    if (result.value && Array.isArray(result.value)) {
      return result.value.map(
        (exchangeIdResult: ExchangeIdResult) => exchangeIdResult.targetId || null
      );
    }
    return officeIds.map(() => null);
  }
}
