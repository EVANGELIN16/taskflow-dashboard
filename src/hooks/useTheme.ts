
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "taskforge-theme";

function getSavedTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (
    saved === "light" ||
    saved === "dark" ||
    saved === "system"
  ) {
    return saved;
  }

  return "system";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function applyTheme() {
      const isDark =
        theme === "dark" ||
        (theme === "system" && mediaQuery.matches);

      document.documentElement.classList.toggle(
        "dark",
        isDark
      );
    }

    applyTheme();
    localStorage.setItem(STORAGE_KEY, theme);

    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  return { theme, setTheme };
}
