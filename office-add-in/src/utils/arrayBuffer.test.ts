/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect } from "vitest";
import { arrayBufferToBase64 } from "./arrayBuffer";

describe("arrayBufferToBase64", () => {
  it("converts empty ArrayBuffer to empty base64 string", () => {
    const buffer = new ArrayBuffer(0);
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe("");
  });

  it("converts simple text to base64", () => {
    const text = "Hello";
    const encoder = new TextEncoder();
    const buffer = encoder.encode(text).buffer;
    const result = arrayBufferToBase64(buffer);

    // "Hello" in base64 is "SGVsbG8="
    expect(result).toBe("SGVsbG8=");
  });

  it("converts binary data to base64", () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in hex
    const buffer = bytes.buffer;
    const result = arrayBufferToBase64(buffer);

    expect(result).toBe("SGVsbG8=");
  });

  it("handles larger binary data", () => {
    // Create a 1KB buffer with sequential values
    const size = 1024;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256;
    }
    const buffer = bytes.buffer;
    const result = arrayBufferToBase64(buffer);

    // Verify it's a valid base64 string
    expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    expect(result.length).toBeGreaterThan(0);

    // Verify round-trip conversion
    const decoded = atob(result);
    expect(decoded.length).toBe(size);
  });

  it("handles null bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x00, 0xff]);
    const buffer = bytes.buffer;
    const result = arrayBufferToBase64(buffer);

    // Decode and verify
    const decoded = atob(result);
    expect(decoded.charCodeAt(0)).toBe(0x00);
    expect(decoded.charCodeAt(1)).toBe(0x01);
    expect(decoded.charCodeAt(2)).toBe(0x02);
    expect(decoded.charCodeAt(3)).toBe(0x00);
    expect(decoded.charCodeAt(4)).toBe(0xff);
  });

  it("matches btoa output for simple strings", () => {
    const text = "Test String 123";
    const encoder = new TextEncoder();
    const buffer = encoder.encode(text).buffer;
    const result = arrayBufferToBase64(buffer);

    // btoa expects a binary string, so convert text to binary string first
    const binaryString = Array.from(encoder.encode(text))
      .map((byte) => String.fromCharCode(byte))
      .join("");
    const expected = btoa(binaryString);

    expect(result).toBe(expected);
  });

  it("handles typical email attachment size (simulated 10KB)", () => {
    const size = 10 * 1024; // 10KB
    const bytes = new Uint8Array(size);
    // Fill with some pattern
    for (let i = 0; i < size; i++) {
      bytes[i] = (i * 7) % 256;
    }
    const buffer = bytes.buffer;
    const result = arrayBufferToBase64(buffer);

    // Base64 encoding increases size by ~33%
    const expectedMinLength = Math.floor((size * 4) / 3);
    expect(result.length).toBeGreaterThanOrEqual(expectedMinLength);

    // Verify it's valid base64
    expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });
});
