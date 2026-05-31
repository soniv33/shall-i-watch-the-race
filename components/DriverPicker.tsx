"use client";

import { useEffect, useRef, useState } from "react";
import { GridDriver } from "@/lib/types";

interface Props {
  drivers: GridDriver[];
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function DriverPicker({ drivers, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value != null ? (drivers.find((d) => d.number === value) ?? null) : null;

  const teams = [...new Set(drivers.map((d) => d.team))];

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

  function handleSelect(num: number) {
    onChange(num === value ? null : num);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  if (drivers.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 px-3 py-2.5 bg-card border rounded-lg text-sm
          focus:outline-none focus:border-foreground/30 cursor-pointer whitespace-nowrap transition-colors
          ${selected ? "border-f1red/40 text-foreground" : "border-border text-muted hover:text-foreground"}
        `}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" strokeWidth={2} />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth={2} strokeLinecap="round" />
        </svg>
        {selected ? (
          <span className="font-semibold tracking-wide text-xs">{selected.acronym}</span>
        ) : (
          <span>Driver</span>
        )}
        {selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear driver"
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
          style={{ minWidth: "220px", maxHeight: "320px" }}
          role="listbox"
          aria-label="Select driver"
        >
          {teams.map((team) => (
            <div key={team}>
              <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted uppercase tracking-widest">
                {team}
              </p>
              {drivers
                .filter((d) => d.team === team)
                .map((driver) => (
                  <button
                    key={driver.number}
                    type="button"
                    role="option"
                    aria-selected={driver.number === value}
                    onClick={() => handleSelect(driver.number)}
                    className={`
                      w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2
                      transition-colors hover:bg-foreground/5 cursor-pointer
                      ${driver.number === value ? "text-foreground" : "text-foreground/70"}
                    `}
                  >
                    <span>{driver.name}</span>
                    <span className={`text-xs font-mono ${driver.number === value ? "text-f1red" : "text-muted"}`}>
                      {driver.acronym}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
