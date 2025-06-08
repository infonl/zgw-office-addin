import { useCallback, useRef } from "react";
import { useLogger } from "./useLogger";
import { useHttp } from "./useHttp";

type State = { file: Office.File; currentSlice: number };

export function useOffice() {
  const metaData = useRef(new Map<string, Record<string, unknown>>());

  const { DEBUG, WARN, ERROR } = useLogger();
  const { POST } = useHttp();

  const getFileName = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      Office.context.document.getFilePropertiesAsync((result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to get file properties", result);
          reject(new Error("Unable to get file properties"));
        }

        resolve(result.value.url.split("/").at(-1) ?? "");
      });
    });
  }, []);

  const addDocumentToZaak = useCallback(
    (zaakIdentificatie: string, data: Record<string, unknown> = {}) => {
      metaData.current.set(zaakIdentificatie, data);
      processFile(zaakIdentificatie);
    },
    []
  );

  const processFile = (zaakIdentificatie: string) => {
    Office.context.document.getFileAsync(Office.FileType.Compressed, async (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        WARN("Unable to process file", result);
        return;
      }

      await getSlice({ file: result.value, currentSlice: 0 }, zaakIdentificatie);
    });

    const getSlice = async (state: State, zaakIdentificatie: string) => {
      DEBUG("Getting slice", state);
      state.file.getSliceAsync(state.currentSlice, async (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to get slice", result);
          return;
        }

        await sendSlice(result.value, state, zaakIdentificatie);
      });
    };

    const sendSlice = async (slice: Office.Slice, state: State, zaakIdentificatie: string) => {
      DEBUG("Sending slice", slice, state);
      var data = slice.data;

      if (!data) {
        WARN("No data in slice:", slice.index);
        return;
      }

      DEBUG("Encoding data...");

      // https://github.com/infonl/podiumd-office-plugin/pull/112#discussion_r2132179467
      const encoded = btoa(data);

      DEBUG("Encoded data");

      try {
        await POST(
          `/zaken/${zaakIdentificatie}/documenten`,
          JSON.stringify({
            ...(metaData.current.get(zaakIdentificatie) ?? {}),
            inhoud: encoded,
            bestandsnaam: await getFileName(),
          })
        );
      } catch (error) {
        ERROR("Error sending slice:", error);
        await closeFile(state);
        return;
      }

      const currentSlice = state.currentSlice + 1;

      DEBUG("Processed slice", {
        currentSlice,
        sliceCount: state.file.sliceCount,
        zaakIdentificatie,
      });

      if (currentSlice < state.file.sliceCount) {
        await getSlice({ ...state, currentSlice }, zaakIdentificatie);
      } else {
        await closeFile(state);
      }
    };
  };

  const closeFile = async (state: State) => {
    state.file.closeAsync(function (result) {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        WARN("Unable to close file", result);
        return;
      }

      DEBUG("File closed successfully");
    });
  };

  return { addDocumentToZaak };
}
