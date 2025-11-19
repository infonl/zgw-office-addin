/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export { GraphServiceClient as GraphService } from "./service/GraphService.client";
export type { GraphAuthProvider, GraphAttachment, GraphMessage } from "./service/GraphTypes";
export { OfficeGraphAuthProvider } from "./provider/OfficeGraphAuthProvider";
