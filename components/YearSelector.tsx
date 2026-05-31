"use client";

interface Props {
  current: number;
}

export default function YearSelector({ current }: Props) {
  const now = new Date().getFullYear();
  // OpenF1 data starts from 2023
  const years = Array.from({ length: now - 2022 }, (_, i) => now - i);

  return (
    <select
      value={current}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("year", e.target.value);
        window.location.href = url.toString();
      }}
      className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground/30 cursor-pointer"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}
