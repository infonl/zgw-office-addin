/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

export const getVerbForm = (count: number, singularVerb: string, pluralVerb: string): string => {
  return count === 1 ? singularVerb : pluralVerb;
};
