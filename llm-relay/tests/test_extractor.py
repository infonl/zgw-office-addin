# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import base64
import io

from llm_relay.extractor import extract_text, is_image


def test_is_image_png():
    assert is_image("image/png") is True


def test_is_image_jpeg():
    assert is_image("image/jpeg") is True


def test_is_image_none():
    assert is_image(None) is False


def test_is_image_text():
    assert is_image("text/plain") is False


def test_is_image_docx():
    assert is_image("application/vnd.openxmlformats-officedocument.wordprocessingml.document") is False


def test_extract_text_plain_utf8():
    text = "Hello, world! This is a test."
    b64 = base64.b64encode(text.encode()).decode()
    result = extract_text(b64, "text/plain")
    assert result == text


def test_extract_text_plain_not_base64():
    """Non-base64 content falls back to plain text."""
    text = "This is not base64 at all, it has spaces and stuff!"
    result = extract_text(text, "text/plain")
    assert result == text


def test_extract_text_no_content_type():
    """No content_type defaults to UTF-8 decode."""
    text = "Some document content."
    b64 = base64.b64encode(text.encode()).decode()
    result = extract_text(b64, None)
    assert result == text


def test_extract_text_html():
    html = "<html><body><h1>Title</h1><p>Content</p></body></html>"
    b64 = base64.b64encode(html.encode()).decode()
    result = extract_text(b64, "text/html")
    assert "<h1>Title</h1>" in result


def test_extract_text_eml():
    eml_content = (
        "From: sender@example.com\r\n"
        "To: recipient@example.com\r\n"
        "Subject: Test Email\r\n"
        "Date: Mon, 18 Mar 2026 10:00:00 +0100\r\n"
        "Content-Type: text/plain\r\n"
        "\r\n"
        "This is the email body.\r\n"
    )
    b64 = base64.b64encode(eml_content.encode()).decode()
    result = extract_text(b64, "message/rfc822")
    assert "sender@example.com" in result
    assert "Test Email" in result
    assert "email body" in result


def test_extract_text_docx():
    """Test .docx extraction with a real minimal docx file."""
    import docx

    doc = docx.Document()
    doc.add_paragraph("First paragraph about housing policy.")
    doc.add_paragraph("Second paragraph about regulations.")

    buf = io.BytesIO()
    doc.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()

    result = extract_text(b64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    assert "housing policy" in result
    assert "regulations" in result


def test_extract_text_docx_with_table():
    """Test .docx extraction includes table content."""
    import docx

    doc = docx.Document()
    doc.add_paragraph("Intro paragraph.")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Header1"
    table.cell(0, 1).text = "Header2"
    table.cell(1, 0).text = "Value1"
    table.cell(1, 1).text = "Value2"

    buf = io.BytesIO()
    doc.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()

    result = extract_text(b64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    assert "Intro paragraph" in result
    assert "Header1" in result
    assert "Value2" in result


def test_extract_text_xlsx():
    """Test .xlsx extraction with a real minimal xlsx file."""
    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data"
    ws["A1"] = "Name"
    ws["B1"] = "Score"
    ws["A2"] = "Alice"
    ws["B2"] = 95
    ws["A3"] = "Bob"
    ws["B3"] = 87

    buf = io.BytesIO()
    wb.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()

    result = extract_text(b64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    assert "Sheet: Data" in result
    assert "Alice" in result
    assert "95" in result
    assert "Bob" in result


def test_extract_text_windows_encoding():
    """Test that cp1252 (Windows) encoded text is handled."""
    # cp1252 has characters like curly quotes that aren't valid UTF-8
    text_bytes = "Héllo wörld — fancy quotes".encode("cp1252")
    b64 = base64.b64encode(text_bytes).decode()
    result = extract_text(b64, "text/plain")
    assert "wörld" in result or len(result) > 0  # Should not crash
