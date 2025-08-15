/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import jwt from "jsonwebtoken";
import { LoggerService } from "./LoggerService";

export class HttpService {
  private readonly baseUrl = process.env.API_BASE_URL!;

  public async POST<T>(url: string, body: BodyInit, headers: HeadersInit = {}) {
    return this.request<T>("POST", url, { body, headers });
  }

  public async GET<T>(url: string, params?: Record<string, string>, headers: HeadersInit = {}) {
    return this.request<T>("GET", url, { headers, params });
  }

  private async request<T>(
    method: "POST" | "GET",
    url: string,
    options: {
      body?: BodyInit;
      headers: HeadersInit;
      params?: Record<string, string>;
    } = { headers: {} },
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
          Authorization: `Bearer ${this.generateJwtToken()}`,
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

  private readonly generateJwtToken = () => {
    return jwt.sign(
      {
        iss: "office-add-in",
        iat: Math.floor(Date.now() / 1000),
        client_id: "office-add-in",
        user_id: "office-add-in",
        user_representation: "office-add-in",
      },
      process.env.JWT_SECRET!,
      {
        algorithm: "HS256",
      },
    );
  };
}
