/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Removes MIME parts marked "Content-Disposition: attachment" from a raw
// .eml message, leaving everything else (headers, text/html body, inline
// images) byte-for-byte untouched.
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitParts(body: string, boundary: string): string[] {
  const marker = escapeRegExp(`--${boundary}`);
  // Splitting on every boundary line (the final one has a trailing "--") yields
  // [preamble, part1, part2, ..., partN, epilogue] — drop the outer two.
  const segments = body.split(new RegExp(`(?:\\r?\\n)?${marker}(?:--)?[ \\t]*\\r?\\n?`));
  return segments.slice(1, -1);
}

/** Strips attachment parts from one multipart body, given its boundary. Returns null if nothing survives. */
function stripMultipartBody(body: string, boundary: string): string | null {
  const keptParts = splitParts(body, boundary)
    .map(processPart)
    .filter((part): part is string => part !== null);

  if (keptParts.length === 0) return null;

  return (
    keptParts.map((part) => `--${boundary}\r\n${part}`).join("\r\n") + `\r\n--${boundary}--\r\n`
  );
}

/** Returns the processed part, or null if the part itself should be dropped entirely. */
function processPart(rawPart: string): string | null {
  const { headers: rawHeaders, body: partBody } = splitHeadersAndBody(rawPart);
  const headers = parseHeaders(rawHeaders);

  if (isAttachmentDisposition(headers.get("content-disposition"))) {
    return null;
  }

  const contentType = headers.get("content-type");
  if (isMultipart(contentType) && !isSigned(contentType)) {
    const boundary = getBoundary(contentType);
    if (boundary) {
      const strippedBody = stripMultipartBody(partBody, boundary);
      // If every nested part was an attachment, keep this part's body as-is
      // rather than emit a container with nothing left in it.
      return strippedBody !== null ? `${rawHeaders}\r\n\r\n${strippedBody}` : rawPart;
    }
  }

  return rawPart;
}

/**
 * Strips MIME parts marked "Content-Disposition: attachment" from a raw
 * .eml string. Leaves signed messages, non-multipart messages, and messages
 * without a parseable boundary untouched.
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
    // Stripping would remove every part — fail safe and keep the original.
    return rawMime;
  }

  return `${headers}\r\n\r\n${strippedBody}`;
}
