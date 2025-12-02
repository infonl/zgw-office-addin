/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

process.env.APP_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.API_BASE_URL = "https://api.test.com";
process.env.FRONTEND_URL = "https://frontend.test.com";
process.env.KEY_PATH = "/tmp/key";
process.env.CERT_PATH = "/tmp/cert";

process.env.CA_CERT_PATH = "/tmp/ca-cert";
process.env.PORT = "3000";
