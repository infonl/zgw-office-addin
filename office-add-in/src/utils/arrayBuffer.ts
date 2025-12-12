/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Chuncked conversion of ArrayBuffer to Base64 to handle large files without stack overflow
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
};
