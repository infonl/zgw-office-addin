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
  const host = Office.context.host;
  const isWord = host === Office.HostType.Word;
  const isOutlook = host === Office.HostType.Outlook;

  const getWordFileName = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      Office.context.document.getFilePropertiesAsync((result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to get file properties", result);
          reject(new Error("Unable to get file properties"));
          return;
        }

        resolve(result.value.url.split("/").at(-1) ?? "");
      });
    });
  }, []);

  const sanitizeFileName = (name: string) =>
    (name || "")
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getOutlookSubject = useCallback(() => {
    try {
      return Office.context.mailbox?.item?.subject ?? "";
    } catch (e) {
      WARN("Unable to get Outlook subject", e);
      return "";
    }
  }, []);

  const getFileName = useCallback(async () => {
    try {
      if (isWord) {
        const n = await getWordFileName();
        return sanitizeFileName(n || "document.docx");
      }
      if (isOutlook) {
        const subj = getOutlookSubject();
        const base = sanitizeFileName(subj || "Outlook-bericht");
        return base.toLowerCase().endsWith(".eml") ? base : `${base}.eml`;
      }
      return "";
    } catch (error) {
      WARN("Unable to get file/mail title", error);
      return "";
    }
  }, [isWord, isOutlook]);

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

  const getWordDocumentData = useCallback(async () => {
    DEBUG("Getting Word document data");
    let file: Office.File | undefined;
    return new Promise<string>((resolve, reject) => {
      Office.context.document.getFileAsync(Office.FileType.Compressed, (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to process file", result);
          reject("Unable to process file");
          return;
        }

        file = result.value;
        getSlice({ file: result.value, currentSlice: 0 })
          .then((slice) => resolve(slice as string))
          .catch((error) => reject(error));
      });
    }).finally(() => {
      closeFile(file);
    });
  }, []);

  // Construct EML from Outlook item, probably not the way to go
  const getOutlookDocumentData = useCallback(async () => {
    // ToDo: Only if body text only is needed
    return "";
  }, []);

  const getDocumentData = useCallback(async () => {
    try {
      if (isWord) return await getWordDocumentData();
      if (isOutlook) return await getOutlookDocumentData();
      return "";
    } catch (error) {
      WARN("Unable to get document data", error);
      return "";
    }
  }, [isWord, isOutlook, getWordDocumentData, getOutlookDocumentData]);

  const getSlice = async (state: State) => {
    DEBUG("Getting slice", state);
    return new Promise((resolve, reject) => {
      state.file.getSliceAsync(state.currentSlice, (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          WARN("Unable to get slice", result);
          reject("Unable to get slice");
          return;
        }

        encodeSlice(result.value, state)
          .then((encoded) => resolve(encoded))
          .catch((error) => reject(error));
      });
    });
  };

  const encodeSlice = async (slice: Office.Slice, state: State) => {
    DEBUG("Encoding slice", slice, state);
    return new Promise((resolve, reject) => {
      const data = slice.data;

      if (!data) {
        WARN("No data in slice:", slice.index);
        reject("No data in slice");
        return;
      }

      try {
        // https://github.com/infonl/zgw-office-addin/pull/112#discussion_r2132179467
        const binaryString = Array.from(data)
          .map((byte) => String.fromCharCode(Number(byte)))
          .join("");
        const encoded = btoa(binaryString);
        DEBUG("Encoded data");

        resolve(encoded);
      } catch (error) {
        reject(error);
      }

      // TODO: handle bigger files
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

  return {
    getDocumentData,
    getSignedInUser,
    getFileName,
    getWordFileName,
    getOutlookSubject,
    host,
    isWord,
    isOutlook,
  };
}
