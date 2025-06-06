import { type HttpService } from "./http.service";

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
        console.warn(result);
        return;
      }

      await this.getSlice({ file: result.value, currentSlice: 0 }, zaakIdentificatie);
    });
  }

  private async getSlice(state: State, zaakIdentificatie: string) {
    console.debug("Getting slice", state);
    state.file.getSliceAsync(state.currentSlice, async (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        console.warn(result);
        return;
      }

      await this.sendSlice(result.value, state, zaakIdentificatie);
    });
  }

  private async sendSlice(slice: Office.Slice, state: State, zaakIdentificatie: string) {
    console.debug("Sending slice", slice, state);
    var data = slice.data;

    if (!data) {
      console.warn("No data in slice:", slice.index);
      return;
    }

    console.debug("Encoding data...");

    const encoded = btoa(data);

    console.debug("Encoded data");

    try {
      await this.httpService.POST(
        `/zaken/${zaakIdentificatie}/documenten`,
        JSON.stringify({ inhoud: encoded })
      );
    } catch (error) {
      console.error("Error sending slice:", error);
      await OfficeService.closeFile(state);
      return;
    }

    const currentSlice = state.currentSlice + 1;

    console.debug("Processed slice", {
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
        console.warn(result);
        return;
      }

      console.debug("File closed successfully");
    });
  }
}
