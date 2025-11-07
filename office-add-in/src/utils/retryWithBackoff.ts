/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class GraphApiError extends Error {
  public readonly status: number;
  public readonly retryAfter?: number;

  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.name = "GraphApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Implements exponential backoff with jitter for resilient API calls
 * Specifically designed for Microsoft Graph API rate limiting
 */
export async function retryWithAdaptiveBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  let adaptiveBaseDelay = baseDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Don't retry authentication errors - they won't resolve with time
      if (error instanceof Error && error.message.includes("Graph authentication failed")) {
        throw error;
      }

      let delay = adaptiveBaseDelay * Math.pow(2, attempt);

      // Handle Graph API specific responses
      if (error instanceof GraphApiError) {
        if (error.status === 401) {
          // Authentication error - don't retry
          throw error;
        } else if (error.status === 429) {
          // Rate limited - respect Retry-After header if available
          if (error.retryAfter) {
            delay = Math.max(delay, error.retryAfter * 1000);
          }
          // Increase base delay for future calls
          adaptiveBaseDelay = Math.min(adaptiveBaseDelay * 1.5, 10000); // Max 10 sec
        } else if (error.status >= 500) {
          // Server error - use shorter delay
          delay = Math.min(delay, 3000);
        } else if (error.status >= 400 && error.status < 500) {
          // Client error - don't retry most 4xx errors
          if (error.status !== 429) {
            throw error;
          }
        }
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000; // 0-1000ms
      const totalDelay = Math.min(delay + jitter, 30000); // Max 30 sec

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${totalDelay}ms`, {
        error: error instanceof Error ? error.message : String(error),
        delay: totalDelay,
      });

      await sleep(totalDelay);
    }
  }

  throw new Error("Max retries exceeded");
}
