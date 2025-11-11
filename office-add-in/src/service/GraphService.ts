/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphApiError, retryWithAdaptiveBackoff } from "../utils/retryWithBackoff";

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
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
  private async graphRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return retryWithAdaptiveBackoff(async () => {
      const token = await this.authProvider.getAccessToken();
      const claims = decodeJwtClaims(token);
      try {
        console.debug("🔐 [Graph] token claims", {
          aud: claims && (claims as any).aud,
          scp: claims && (claims as any).scp,
          roles: claims && (claims as any).roles,
          tid: claims && (claims as any).tid,
          oid: claims && (claims as any).oid,
          appid: claims && (claims as any).appid,
          iat: claims && (claims as any).iat,
          exp: claims && (claims as any).exp,
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
        let errorBody: any = null;
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
   * Gets the current user's email message by ID
   */
  async getMessage(messageId: string): Promise<GraphMessage> {
    return this.graphRequest<GraphMessage>(`/me/messages/${messageId}`);
  }

  /**
   * Gets specific attachment content from an email message
   * Returns base64 encoded content for files > 3MB via streaming
   */
  async getAttachmentContent(messageId: string, attachmentId: string): Promise<string> {
    return retryWithAdaptiveBackoff(async () => {
      const token = await this.authProvider.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/me/messages/${messageId}/attachments/${attachmentId}/$value`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const retryAfter = response.headers.get("Retry-After");
        throw new GraphApiError(
          response.status,
          `Failed to download attachment ${attachmentId} from message ${messageId}: ${response.statusText}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      // Convert binary response to base64 efficiently
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // More efficient conversion for large files
      const chunkSize = 1024 * 1024; // 1MB chunks
      let binary = "";

      for (let i = 0; i < bytes.byteLength; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }

      return btoa(binary);
    });
  }

  /**
   * Gets the raw email content as EML format
   * Useful for archiving entire emails with attachments
   * Throws error if EML would exceed nginx 80MB limit after base64 encoding
   */
  async getEmailAsEML(messageId: string): Promise<string> {
    return retryWithAdaptiveBackoff(async () => {
      const token = await this.authProvider.getAccessToken();

      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/$value`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const retryAfter = response.headers.get("Retry-After");
        let details = "";
        try {
          const t = await response.clone().text();
          details = t;
        } catch (error) {
          console.debug("GraphService: caught error (ignored)", error);
        }
        throw new GraphApiError(
          response.status,
          `Failed to download email from /me/messages/${messageId}/$value: ${response.statusText} — ${details}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      console.debug("✅ [Graph] EML fetched", { messageId });
      return response.text(); // EML is plain text format
    });
  }

  /**
   * Utility: Convert EML content to base64 for API submission
   * Validates size constraints (nginx MAX_BODY_SIZE: 80MB)
   */
  emlToBase64(emlContent: string): string {
    // Check size before base64 encoding
    // Base64 adds ~33% overhead, nginx limit is 80MB
    const maxRawSize = 60 * 1024 * 1024; // 60MB raw = ~80MB base64
    const emlSizeBytes = new Blob([emlContent]).size;

    if (emlSizeBytes > maxRawSize) {
      throw new Error(
        `EML bestand te groot: ${Math.round(emlSizeBytes / 1024 / 1024)}MB. ` +
          `Maximum: ${Math.round(maxRawSize / 1024 / 1024)}MB (nginx limiet: 80MB na base64 encoding)`
      );
    }

    return btoa(unescape(encodeURIComponent(emlContent)));
  }
}
