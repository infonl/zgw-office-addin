/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useLogger } from "./useLogger";

export function useHttp() {
  const { DEBUG, ERROR } = useLogger(useHttp.name);

  const baseUrl = "https://localhost:3003";

  async function POST<T>(url: string, body: BodyInit, headers: HeadersInit = {}) {
    return request<T>("POST", url, { body, headers });
  }

  async function GET<T>(url: string, params?: Record<string, string>, headers: HeadersInit = {}) {
    return request<T>("GET", url, { headers, params });
  }

  async function request<T>(
    method: "POST" | "GET",
    url: string,
    options: {
      body?: BodyInit;
      headers: HeadersInit;
      params?: Record<string, string>;
    } = { headers: {} }
  ): Promise<T> {
    const fullUrl = new URL(`${baseUrl}${url}`);
    if (options.params) {
      fullUrl.search = new URLSearchParams(options.params).toString();
    }

    DEBUG(`[${method}] ${fullUrl}`, options);

    try {
      const request: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };

      if (options.body && request.method === "POST") {
        request.body = options.body;
      }

      const response = await fetch(fullUrl, request);

      DEBUG(`[${method}] [STATUS] ${fullUrl}`, {
        status: response.status,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      DEBUG(`[${method}] [RESULT] ${fullUrl}`, data);

      return data;
    } catch (error) {
      ERROR(`[${method}] [ERROR] ${fullUrl}`, error);
      throw error;
    }
  }

  return { GET, POST };
}
