"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  teams: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function TeamPicker({ teams, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSelect(team: string) {
    onChange(team === value ? null : team);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  if (teams.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 px-3 py-2.5 bg-card border rounded-lg text-sm
          focus:outline-none focus:border-foreground/30 cursor-pointer whitespace-nowrap transition-colors
          ${value ? "border-f1red/40 text-foreground" : "border-border text-muted hover:text-foreground"}
        `}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 6h18M3 12h18M3 18h18" strokeWidth={2} strokeLinecap="round" />
        </svg>
        {value ? (
          <span className="font-semibold text-xs">{value}</span>
        ) : (
          <span>Team</span>
        )}
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear team"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            className="ml-0.5 text-muted hover:text-foreground transition-colors leading-none cursor-pointer"
          >
            &times;
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-y-auto"
          style={{ minWidth: "180px", maxHeight: "320px" }}
          role="listbox"
          aria-label="Select team"
        >
          {teams.map((team) => (
            <button
              key={team}
              type="button"
              role="option"
              aria-selected={team === value}
              onClick={() => handleSelect(team)}
              className={`
                w-full text-left px-3 py-2.5 text-sm
                transition-colors hover:bg-foreground/5 cursor-pointer
                ${team === value ? "text-foreground font-semibold" : "text-foreground/70"}
              `}
            >
              {team}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
