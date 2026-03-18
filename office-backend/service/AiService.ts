/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { LoggerService } from "./LoggerService";
import { DocumentInfo } from "../src/types";

export class AiService {
  public async getMetadata(documentInfo: DocumentInfo) {
    LoggerService.debug(`Getting AI metadata for document "${documentInfo.title}"`, {
      title: documentInfo.title,
      size: documentInfo.size,
      contentType: documentInfo.contentType,
      attachmentType: documentInfo.attachmentType,
      inhoud: documentInfo.inhoud,
    });

    return {
      succes: true,
      data: {
        beschrijving: "AI GEGENEREERDE BESCHRIJVING",
      },
    };
  }
}
