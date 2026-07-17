/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect } from "vitest";
import { stripEmailAttachments } from "./stripEmailAttachments";

const CRLF = "\r\n";

// Adapted from Microsoft's own MIME example:
// https://learn.microsoft.com/en-us/graph/outlook-get-mime-message
function buildEmailWithAttachment(): string {
  const innerBoundary = "_000_inner_";
  const outerBoundary = "_004_outer_";

  const inner = [
    `--${innerBoundary}`,
    `Content-Type: text/plain; charset="iso-8859-1"`,
    "",
    "The attachment is an email.",
    `--${innerBoundary}`,
    `Content-Type: text/html; charset="iso-8859-1"`,
    "",
    "<html><body><p>The attachment is an email.</p></body></html>",
    `--${innerBoundary}--`,
    "",
  ].join(CRLF);

  return [
    `MIME-Version: 1.0`,
    `From: Administrator <admin@info.nl>`,
    `Subject: This email has attachment.`,
    `Content-Type: multipart/mixed; boundary="${outerBoundary}"`,
    "",
    `--${outerBoundary}`,
    `Content-Type: multipart/alternative; boundary="${innerBoundary}"`,
    "",
    inner,
    `--${outerBoundary}`,
    `Content-Type: application/octet-stream; name="Attachment email.eml"`,
    `Content-Disposition: attachment; filename="Attachment email.eml"`,
    `Content-Transfer-Encoding: base64`,
    "",
    "RnJvbToJQWRtaW5pc3RyYXRvciA8YWRtaW5AdGVuYW50LUVYSEItMTQ3MS5jb20+",
    `--${outerBoundary}--`,
    "",
  ].join(CRLF);
}

describe("stripEmailAttachments", () => {
  it("removes the attachment part but keeps the text/html body intact", () => {
    const result = stripEmailAttachments(buildEmailWithAttachment());

    expect(result).not.toContain("Content-Disposition: attachment");
    expect(result).not.toContain(
      "RnJvbToJQWRtaW5pc3RyYXRvciA8YWRtaW5AdGVuYW50LUVYSEItMTQ3MS5jb20+"
    );
    expect(result).toContain("The attachment is an email.");
    expect(result).toContain("<html><body><p>The attachment is an email.</p></body></html>");
  });

  it("preserves top-level headers verbatim", () => {
    const result = stripEmailAttachments(buildEmailWithAttachment());

    expect(result).toContain("From: Administrator <admin@info.nl>");
    expect(result).toContain("Subject: This email has attachment.");
  });

  it("produces a validly terminated multipart body", () => {
    const result = stripEmailAttachments(buildEmailWithAttachment());
    const boundaryMatch = result.match(/boundary="([^"]+)"/);
    expect(boundaryMatch).not.toBeNull();
    const boundary = boundaryMatch![1];

    expect(result.trimEnd().endsWith(`--${boundary}--`)).toBe(true);
    // Only one part should remain (the multipart/alternative body)
    expect(result.split(`--${boundary}${CRLF}`).length).toBe(2);
  });

  it("removes multiple sibling attachments", () => {
    const boundary = "_boundary_";
    const message = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain`,
      "",
      "Body text",
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Disposition: attachment; filename="a.pdf"`,
      "",
      "pdf-bytes-1",
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Disposition: attachment; filename="b.pdf"`,
      "",
      "pdf-bytes-2",
      `--${boundary}--`,
      "",
    ].join(CRLF);

    const result = stripEmailAttachments(message);

    expect(result).toContain("Body text");
    expect(result).not.toContain("pdf-bytes-1");
    expect(result).not.toContain("pdf-bytes-2");
    expect(result).not.toContain("Content-Disposition: attachment");
  });

  it("keeps inline images (Content-Disposition: inline) untouched", () => {
    const boundary = "_boundary_";
    const message = [
      `Content-Type: multipart/related; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/html`,
      "",
      '<html><img src="cid:logo"></html>',
      `--${boundary}`,
      `Content-Type: image/png`,
      `Content-Disposition: inline; filename="logo.png"`,
      `Content-ID: <logo>`,
      "",
      "png-bytes",
      `--${boundary}--`,
      "",
    ].join(CRLF);

    const result = stripEmailAttachments(message);

    expect(result).toContain("png-bytes");
    expect(result).toContain('<img src="cid:logo">');
  });

  it("strips a nested attachment inside multipart/mixed containing multipart/related", () => {
    const outerBoundary = "_outer_";
    const relatedBoundary = "_related_";
    const related = [
      `--${relatedBoundary}`,
      `Content-Type: text/html`,
      "",
      "<html>body</html>",
      `--${relatedBoundary}--`,
      "",
    ].join(CRLF);

    const message = [
      `Content-Type: multipart/mixed; boundary="${outerBoundary}"`,
      "",
      `--${outerBoundary}`,
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
      "",
      related,
      `--${outerBoundary}`,
      `Content-Type: application/zip`,
      `Content-Disposition: attachment; filename="archive.zip"`,
      "",
      "zip-bytes",
      `--${outerBoundary}--`,
      "",
    ].join(CRLF);

    const result = stripEmailAttachments(message);

    expect(result).toContain("<html>body</html>");
    expect(result).not.toContain("zip-bytes");
  });

  it("leaves multipart/signed (S/MIME) messages untouched", () => {
    const boundary = "_signed_";
    const message = [
      `Content-Type: multipart/signed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain`,
      "",
      "signed body",
      `--${boundary}`,
      `Content-Type: application/pkcs7-signature`,
      `Content-Disposition: attachment; filename="smime.p7s"`,
      "",
      "signature-bytes",
      `--${boundary}--`,
      "",
    ].join(CRLF);

    expect(stripEmailAttachments(message)).toBe(message);
  });

  it("leaves non-multipart messages untouched", () => {
    const message = [
      `Content-Type: text/plain; charset="utf-8"`,
      "",
      "Just a plain email, no attachments here.",
    ].join(CRLF);

    expect(stripEmailAttachments(message)).toBe(message);
  });

  it("leaves the message untouched if every part would be stripped", () => {
    const boundary = "_boundary_";
    const message = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Disposition: attachment; filename="only.pdf"`,
      "",
      "pdf-bytes",
      `--${boundary}--`,
      "",
    ].join(CRLF);

    expect(stripEmailAttachments(message)).toBe(message);
  });

  it("leaves the message untouched if the boundary can't be parsed", () => {
    const message = [`Content-Type: multipart/mixed`, "", "no boundary declared"].join(CRLF);

    expect(stripEmailAttachments(message)).toBe(message);
  });
});
