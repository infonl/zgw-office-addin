/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { type HttpService } from "./http.service";
import { LoggerService } from "./logger.service";

type State = { file: Office.File; currentSlice: number };

// Based on https://learn.microsoft.com/en-us/office/dev/add-ins/develop/get-the-whole-document-from-an-add-in-for-powerpoint-or-word
export class OfficeService {
  constructor(private readonly httpService: HttpService) {}

  public async addDocumentToZaak(zaakIdentificatie: string) {
    await this.processFile(zaakIdentificatie);
  }

  private async processFile(zaakIdentificatie: string) {
    Office.context.document.getFileAsync(Office.FileType.Compressed, async (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        LoggerService.warn("Unable to process file", result);
        return;
      }

      await this.getSlice({ file: result.value, currentSlice: 0 }, zaakIdentificatie);
    });
  }

  private async getSlice(state: State, zaakIdentificatie: string) {
    LoggerService.debug("Getting slice", state);
    state.file.getSliceAsync(state.currentSlice, async (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        LoggerService.warn("Unable to get slice", result);
        return;
      }

      await this.sendSlice(result.value, state, zaakIdentificatie);
    });
  }

  private async sendSlice(slice: Office.Slice, state: State, zaakIdentificatie: string) {
    LoggerService.debug("Sending slice", slice, state);
    var data = slice.data;

    if (!data) {
      LoggerService.warn("No data in slice:", slice.index);
      return;
    }

    LoggerService.debug("Encoding data...");

    // https://github.com/infonl/podiumd-office-plugin/pull/112#discussion_r2132179467
    const encoded = btoa(data);

    LoggerService.debug("Encoded data");

    try {
      await this.httpService.POST(
        `/zaken/${zaakIdentificatie}/documenten`,
        JSON.stringify({
          inhoud: encoded,
        })
      );
    } catch (error) {
      LoggerService.error("Error sending slice:", error);
      await OfficeService.closeFile(state);
      return;
    }

    const currentSlice = state.currentSlice + 1;

    LoggerService.debug("Processed slice", {
      currentSlice,
      sliceCount: state.file.sliceCount,
      zaakIdentificatie,
    });

    if (currentSlice < state.file.sliceCount) {
      await this.getSlice({ ...state, currentSlice }, zaakIdentificatie);
    } else {
      await OfficeService.closeFile(state);
    }
  }

  private static async closeFile(state: State) {
    state.file.closeAsync(function (result) {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        LoggerService.warn("Unable to close file", result);
        return;
      }

      LoggerService.debug("File closed successfully");
    });
  }
}
