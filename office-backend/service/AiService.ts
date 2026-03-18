/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
// import { type DrcType } from "../../generated/drc-generated-types";
// import { type ZrcType } from "../../generated/zrc-generated-types";
// import { TokenService } from "./TokenService";
export class AiService {


  public async getMetadata(document: string) {
    LoggerService.debug(`Getting AI metadata for document ${document}`);
    
    return {
        succes: true,
        data: {
            beschrijving: "AI GEGENEREERDE BESCHRIJVING"
        }
    }
  }
}