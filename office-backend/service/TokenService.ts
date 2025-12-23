/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { jwtDecode } from "jwt-decode";
import { Unauthorized } from "../exception/Unauthorized";

export class TokenService {
  public getUserInfo(token?: string): { preferedUsername: string; name: string } {
    try {
      if (!token) {
        throw new Unauthorized();
      }
      const cleanedToken = String(token).replace("Bearer ", "");

      const decodedToken = jwtDecode<{ preferred_username: string; name: string }>(cleanedToken);

      if (!decodedToken.preferred_username || !decodedToken.name) {
        throw new Unauthorized();
      }
      return {
        preferedUsername: decodedToken.preferred_username,
        name: decodedToken.name,
      };
    } catch (error) {
      throw new Unauthorized();
    }
  }
}
