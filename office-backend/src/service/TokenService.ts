/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { jwtDecode } from "jwt-decode";
import { Unauthorized } from "../exception/Unauthorized";
import type { TokenInfo } from "../dto/TokenInfo";

export class TokenService {
  public getTokenInfo(token?: string): TokenInfo {
    if (!token) throw new Unauthorized();
    try {
      const cleanedToken = String(token).replace("Bearer ", "");

      const decodedToken = jwtDecode<{ preferred_username: string; name: string; uti?: string }>(
        cleanedToken,
      );

      if (!decodedToken.preferred_username || !decodedToken.name) {
        throw new Unauthorized();
      }
      return {
        preferredUsername: decodedToken.preferred_username,
        name: decodedToken.name,
        uti: decodedToken.uti,
      };
    } catch {
      throw new Unauthorized();
    }
  }
}
