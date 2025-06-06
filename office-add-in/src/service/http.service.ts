/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class HttpService {
  private readonly baseUrl = "https://localhost:3003";

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
    } = { headers: {} }
  ): Promise<T> {
    const fullUrl = new URL(`${this.baseUrl}${url}`);
    if (options.params) {
      fullUrl.search = new URLSearchParams(options.params).toString();
    }

    console.debug(`[HTTP] ${method} - ${fullUrl}`, options);

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

      console.debug(`[HTTP] ${method} - ${fullUrl}`, {
        status: response.status,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.debug(`[HTTP] ${method} - ${fullUrl}`, data);

      return data;
    } catch (error) {
      console.error(`[HTTP] ${method} - ${fullUrl}`, error);
      throw error;
    }
  }
}
