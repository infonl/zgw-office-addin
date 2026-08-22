/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Replaces MIME parts marked "Content-Disposition: attachment" in a raw
// .eml message with a small text/plain note naming the removed file, leaving
// everything else (headers, text/html body, inline images) byte-for-byte
// untouched. The note has no Content-Disposition/attachment framing of its
// own, so mail clients render it as plain text rather than as a downloadable
// attachment — the original content is gone, but that one existed is not.
//
// Microsoft Graph's GET /me/messages/{id}/$value endpoint has no option to
// exclude attachments server-side — it always returns the full raw MIME —
// so this runs client-side on the string returned by
// GraphServiceClient.getEmailAsEML.
//
// Signed messages (multipart/signed, e.g. S/MIME) are left untouched:
// removing a part could invalidate the signature, and signature parts
// aren't the kind of "attachment" this is meant to strip.

type MimeHeaders = Map<string, string>;

function splitHeadersAndBody(message: string): { headers: string; body: string } {
  const separatorMatch = message.match(/\r?\n\r?\n/);
  if (!separatorMatch || separatorMatch.index === undefined) {
    return { headers: message, body: "" };
  }
  return {
    headers: message.slice(0, separatorMatch.index),
    body: message.slice(separatorMatch.index + separatorMatch[0].length),
  };
}

function parseHeaders(rawHeaders: string): MimeHeaders {
  // Unfold header folding (continuation lines start with whitespace)
  const unfolded = rawHeaders.replace(/\r?\n[ \t]+/g, " ");
  const headers: MimeHeaders = new Map();
  for (const line of unfolded.split(/\r?\n/)) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    headers.set(line.slice(0, colonIndex).trim().toLowerCase(), line.slice(colonIndex + 1).trim());
  }
  return headers;
}

function getBoundary(contentType: string | undefined): string | null {
  const match = contentType?.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

function isMultipart(contentType: string | undefined): boolean {
  return !!contentType && /^multipart\//i.test(contentType.trim());
}

function isSigned(contentType: string | undefined): boolean {
  return !!contentType && /^multipart\/signed/i.test(contentType.trim());
}

function isAttachmentDisposition(disposition: string | undefined): boolean {
  return !!disposition && /^attachment\b/i.test(disposition.trim());
}

/** Reads a `param=value` or `param="value"` pair out of a header value, decoding RFC 2231 (`param*=UTF-8''value`) encoding if present. */
function extractHeaderParam(headerValue: string | undefined, param: string): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(new RegExp(`${param}\\*?=(?:"([^"]+)"|([^;\\s]+))`, "i"));
  if (!match) return null;
  let value = match[1] ?? match[2] ?? null;
  if (value && /^[^']*''/.test(value)) {
    value = value.replace(/^[^']*''/, "");
    try {
      value = decodeURIComponent(value);
    } catch {
      // Malformed percent-encoding — fall back to the raw (still readable) value.
    }
  }
  return value;
}

function getAttachmentFilename(headers: MimeHeaders): string | null {
  return (
    extractHeaderParam(headers.get("content-disposition"), "filename") ??
    extractHeaderParam(headers.get("content-type"), "name")
  );
}

function getMediaType(contentType: string | undefined): string | null {
  return contentType?.split(";")[0].trim() || null;
}

/** Builds a text/plain replacement part noting the filename/type of a removed attachment, without its content. */
function buildRemovedAttachmentNote(headers: MimeHeaders): string {
  const filename = getAttachmentFilename(headers);
  const mediaType = getMediaType(headers.get("content-type"));
  const label = [filename, mediaType ? `(${mediaType})` : null].filter(Boolean).join(" ");
  const note = `[Bijlage verwijderd: ${label || "onbekende bijlage"}]`;
  return `Content-Type: text/plain; charset="utf-8"\r\n\r\n${note}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitParts(body: string, boundary: string): string[] {
  const escapedBoundary = escapeRegExp(boundary);
  // RFC 2046: a boundary delimiter line must be preceded by CRLF (that CRLF
  // is part of the delimiter itself, not the preceding part's content) and
  // must start the line. Requiring that leading CRLF — rather than making
  // it optional — is what stops the same literal bytes appearing mid-line
  // inside a part's content (e.g. inside base64-encoded attachment data)
  // from being mistaken for a real boundary. Prepending a synthetic "\n"
  // lets the very first boundary (which has no real preceding CRLF) match
  // via the same rule.
  const delimiterPattern = new RegExp(`\\r?\\n--${escapedBoundary}(?:--)?[ \\t]*\\r?\\n?`, "g");
  const segments = ("\n" + body).split(delimiterPattern);
  // Splitting on every boundary line (the final one has a trailing "--") yields
  // [preamble, part1, part2, ..., partN, epilogue] — drop the outer two.
  return segments.slice(1, -1);
}

/** Processes each part of a multipart body, given its boundary. Returns null if the body contains no parts at all (malformed). */
function stripMultipartBody(body: string, boundary: string): string | null {
  const keptParts = splitParts(body, boundary).map(processPart);

  if (keptParts.length === 0) return null;

  return (
    keptParts.map((part) => `--${boundary}\r\n${part}`).join("\r\n") + `\r\n--${boundary}--\r\n`
  );
}

/** Returns the part to keep in its place: unchanged, recursively stripped, or replaced with a removed-attachment note. */
function processPart(rawPart: string): string {
  const { headers: rawHeaders, body: partBody } = splitHeadersAndBody(rawPart);
  const headers = parseHeaders(rawHeaders);

  if (isAttachmentDisposition(headers.get("content-disposition"))) {
    return buildRemovedAttachmentNote(headers);
  }

  const contentType = headers.get("content-type");
  if (isMultipart(contentType) && !isSigned(contentType)) {
    const boundary = getBoundary(contentType);
    if (boundary) {
      const strippedBody = stripMultipartBody(partBody, boundary);
      // If the nested body couldn't be parsed at all, keep this part's body as-is.
      return strippedBody !== null ? `${rawHeaders}\r\n\r\n${strippedBody}` : rawPart;
    }
  }

  return rawPart;
}

/**
 * Replaces MIME parts marked "Content-Disposition: attachment" in a raw
 * .eml string with a text/plain note of their filename/type. Leaves signed
 * messages, non-multipart messages, and messages without a parseable
 * boundary untouched.
 */
export function stripEmailAttachments(rawMime: string): string {
  const { headers, body } = splitHeadersAndBody(rawMime);
  const contentType = parseHeaders(headers).get("content-type");

  if (!isMultipart(contentType) || isSigned(contentType)) {
    return rawMime;
  }

  const boundary = getBoundary(contentType);
  if (!boundary) {
    return rawMime;
  }

  const strippedBody = stripMultipartBody(body, boundary);
  if (strippedBody === null) {
    // Body contains no parts at all — fail safe and keep the original.
    return rawMime;
  }

  return `${headers}\r\n\r\n${strippedBody}`;
}
