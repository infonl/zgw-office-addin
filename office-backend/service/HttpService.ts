/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import jwt from "jsonwebtoken";
import { LoggerService } from "./LoggerService";
import { envServerSchema } from "../src/envSchema";

export class HttpService {
  private readonly baseUrl = envServerSchema.API_BASE_URL;

  public async POST<T>(
    url: string,
    body: BodyInit,
    userInfo: { preferedUsername: string; name: string },
    headers: HeadersInit = {},
  ) {
    return this.request<T>("POST", url, { body, headers }, userInfo);
  }

  public async GET<T>(url: string, params?: Record<string, string>, headers: HeadersInit = {}) {
    return this.request<T>("GET", url, { headers, params }, { preferedUsername: "Office Add-in", name: "Office Add-in" });
  }

  private async request<T>(
    method: "POST" | "GET",
    url: string,
    options: {
      body?: BodyInit;
      headers: HeadersInit;
      params?: Record<string, string>;
    } = { headers: {} },
    userInfo: { preferedUsername: string; name: string },
  ): Promise<T> {
    const fullUrl = /^https?:\/\//i.test(url) ? url : new URL(url, this.baseUrl);
    if (options.params) {
      fullUrl.search = new URLSearchParams(options.params).toString();
    }

    LoggerService.debug(`[HTTP] [${method}] ${fullUrl}`, options);

    try {
      const request: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: `Bearer ${this.generateJwtToken(userInfo)}`,
          ...options.headers,
        },
      };

      if (options.body && request.method === "POST") {
        request.body = options.body;
      }

      const response = await fetch(fullUrl, request);

      LoggerService.debug(`[HTTP] [${method}] [STATUS] ${fullUrl}`, {
        status: response.status,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      LoggerService.debug(`[HTTP] [${method}] [RESULT] ${fullUrl}`, data);

      return data;
    } catch (error) {
      LoggerService.error(`[HTTP] [${method}] [ERROR] ${fullUrl}`, error);
      throw error;
    }
  }

  private readonly generateJwtToken = (userInfo: { preferedUsername: string; name: string }) => {
    return jwt.sign(
      {
        iss: "office-add-in",
        iat: Math.floor(Date.now() / 1000),
        client_id: "office-add-in",
        user_id: userInfo.preferedUsername || "Office Add-in",
        user_representation: userInfo.name || "Office Add-in",
      },
      envServerSchema.JWT_SECRET,
      { algorithm: "HS256" },
    );
  };
}
