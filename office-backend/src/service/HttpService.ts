/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import jwt from "jsonwebtoken";
import { LoggerService } from "./LoggerService";
import { envServerSchema } from "../envSchema";
import { TokenInfo } from "../dto/TokenInfo";

export class HttpService {
  private readonly baseUrl = envServerSchema.API_BASE_URL;

  public async POST<T>(
    url: string,
    body: string,
    tokenInfo: TokenInfo,
    headers: Record<string, string> = {},
  ) {
    if (tokenInfo === undefined) {
      throw new Error("User info is required to add document to zaak");
    }
    return this.request<T>("POST", url, { body, headers }, tokenInfo);
  }

  public async GET<T>(
    url: string,
    tokenInfo: TokenInfo,
    params?: Record<string, string>,
    headers: Record<string, string> = {},
  ) {
    return this.request<T>("GET", url, { headers, params }, tokenInfo);
  }

  private async request<T>(
    method: "POST" | "GET",
    url: string,
    options: {
      body?: string;
      headers: Record<string, string>;
      params?: Record<string, string>;
    } = { headers: {} },
    tokenInfo: TokenInfo,
  ): Promise<T> {
    const fullUrl = new URL(url, this.baseUrl);
    if (options.params) {
      fullUrl.search = new URLSearchParams(options.params).toString();
    }

    LoggerService.debug(`[HTTP] [${method}] ${fullUrl.toString()}`, options);

    try {
      const request: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: `Bearer ${this.generateJwtToken(tokenInfo)}`,
          ...options.headers,
        },
      };

      if (options.body && request.method === "POST") {
        request.body = options.body;
      }

      const response = await fetch(fullUrl, request);

      LoggerService.debug(`[HTTP] [${method}] [STATUS] ${fullUrl.toString()}`, {
        status: response.status,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as T;

      LoggerService.debug(`[HTTP] [${method}] [RESULT] ${fullUrl.toString()}`, data);

      return data;
    } catch (error) {
      LoggerService.error(`[HTTP] [${method}] [ERROR] ${fullUrl.toString()}`, error);
      throw error;
    }
  }

  private readonly generateJwtToken = (tokenInfo: TokenInfo) => {
    return jwt.sign(
      {
        iss: "office-add-in",
        iat: Math.floor(Date.now() / 1000),
        client_id: "office-add-in",
        user_id: tokenInfo.preferredUsername,
        user_representation: tokenInfo.name,
      },
      envServerSchema.JWT_SECRET,
      { algorithm: "HS256" },
    );
  };
}
