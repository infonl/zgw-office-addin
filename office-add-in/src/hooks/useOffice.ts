/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useCallback } from "react";
import { useLogger } from "./useLogger";
import { jwtDecode } from "jwt-decode";

type State = { file: Office.File; currentSlice: number };

// Based on https://learn.microsoft.com/en-us/office/dev/add-ins/develop/get-the-whole-document-from-an-add-in-for-powerpoint-or-word
export function useOffice() {
  const { DEBUG, WARN } = useLogger(useOffice.name);

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

  const getSignedInUser = useCallback(async () => {
    try {
      const userTokenEncoded = await Office.auth.getAccessToken();
      const userToken = jwtDecode<{ preferred_username?: string; name?: string }>(userTokenEncoded);
      return userToken.preferred_username ?? userToken.name ?? null;
    } catch (error) {
      WARN("Unable to get user access token", error);
      return null;
    }
  }, []);

  const getDocumentData = useCallback(async () => {
    DEBUG("Getting document data");
    let file: Office.File | undefined;
    return new Promise(async (resolve, reject) => {
      Office.context.document.getFileAsync(Office.FileType.Compressed, async (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to process file", result);
          reject("Unable to process file");
        }

        file = result.value;
        const slice = await getSlice({ file: result.value, currentSlice: 0 });
        resolve(slice);
      });
    }).finally(() => {
      closeFile(file);
    });
  }, []);

  const getSlice = async (state: State) => {
    DEBUG("Getting slice", state);
    return new Promise((resolve, reject) => {
      state.file.getSliceAsync(state.currentSlice, async (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to get slice", result);
          reject("Unable to get slice");
        }

        const encoded = await encodeSlice(result.value, state);
        resolve(encoded);
      });
    });
  };

  const encodeSlice = async (slice: Office.Slice, state: State) => {
    DEBUG("Encoding slice", slice, state);
    return new Promise(async (resolve, reject) => {
      var data = slice.data;

      if (!data) {
        WARN("No data in slice:", slice.index);
        reject("No data in slice");
      }

      // https://github.com/infonl/podiumd-office-plugin/pull/112#discussion_r2132179467
      const encoded = btoa(data);
      DEBUG("Encoded data");

      resolve(encoded);
      // TODO: bigger files
      // const currentSlice = state.currentSlice + 1;

      // DEBUG("Processed slice", {
      //   currentSlice,
      //   sliceCount: state.file.sliceCount,
      // });

      // if (currentSlice < state.file.sliceCount) {
      //   await getSlice({ ...state, currentSlice });
      //   return;
      // }
      // await closeFile(state);
    });
  };

  const closeFile = async (file?: Office.File) => {
    file?.closeAsync(function (result) {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        WARN("Unable to close file", result);
        return;
      }

      DEBUG("File closed successfully");
    });
  };

  return { getDocumentData, getSignedInUser, getFileName };
}
