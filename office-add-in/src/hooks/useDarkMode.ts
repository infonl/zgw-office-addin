/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useEffect, useState } from "react";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function useDarkMode(): { isDarkMode: boolean } {
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia?.(COLOR_SCHEME_QUERY).matches ?? false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDarkMode(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { isDarkMode };
}
