/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Eenvoudige cache voor per-bestand formulierwaarden
// Geen JSX of react-hook-form hier, zodat dit bestand `.ts` kan blijven

export type PerFileValues = Record<string, any>;

const cache = new Map<string, PerFileValues>();

export function getPerFileValues(fileId: string): PerFileValues | undefined {
  return cache.get(fileId);
}

export function setPerFileValues(fileId: string, values: PerFileValues): void {
  cache.set(fileId, values);
}

export function clearPerFileValues(fileId?: string): void {
  if (fileId) cache.delete(fileId);
  else cache.clear();
}
