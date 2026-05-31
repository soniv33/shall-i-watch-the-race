"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("siwr-theme") as "dark" | "light" | null) ?? "dark";
    setTheme(stored);
    // Re-assert the attribute in case React hydration reset it to the server default
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("siwr-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
    >
      {theme === "dark" ? (
        // Sun icon — click to go light
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" strokeWidth={2} />
          <path strokeWidth={2} strokeLinecap="round"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon — click to go dark
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
