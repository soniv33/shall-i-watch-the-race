"use client";

import { useState, useMemo, useEffect } from "react";
import { F1Session, GridDriver } from "@/lib/types";
import SessionCard from "./SessionCard";
import YearSelector from "./YearSelector";
import DriverPicker from "./DriverPicker";
import TeamPicker from "./TeamPicker";

const LS_DRIVER = "siwr-driver";
const LS_TEAM = "siwr-team";

const SESSION_TYPES = ["All", "Race", "Sprint"];

export default function HomeContent({
  sessions,
  year,
  isCurrentYear,
  apiError = false,
}: {
  sessions: F1Session[];
  year: number;
  isCurrentYear: boolean;
  apiError?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [driverPref, setDriverPref] = useState<number | null>(null);
  const [teamPref, setTeamPref] = useState<string | null>(null);
  const [gridDrivers, setGridDrivers] = useState<GridDriver[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(true);

  useEffect(() => {
    setLoadingGrid(true);
    setGridDrivers([]);
    fetch(`/api/grid?year=${year}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGridDrivers(data); })
      .catch(() => {})
      .finally(() => setLoadingGrid(false));
  }, [year]);

  useEffect(() => {
    const storedDriver = localStorage.getItem(LS_DRIVER);
    if (storedDriver) {
      const num = Number(storedDriver);
      if (!Number.isNaN(num)) setDriverPref(num);
    }
    const storedTeam = localStorage.getItem(LS_TEAM);
    if (storedTeam) setTeamPref(storedTeam);
  }, []);

  function handleDriverChange(value: number | null) {
    setDriverPref(value);
    if (value != null) localStorage.setItem(LS_DRIVER, String(value));
    else localStorage.removeItem(LS_DRIVER);
  }

  function handleTeamChange(value: string | null) {
    setTeamPref(value);
    if (value != null) localStorage.setItem(LS_TEAM, value);
    else localStorage.removeItem(LS_TEAM);
  }

  const teams = useMemo(() => [...new Set(gridDrivers.map((d) => d.team))], [gridDrivers]);

  const preferredNums = useMemo(() => {
    const nums: number[] = [];
    if (driverPref != null) nums.push(driverPref);
    if (teamPref != null) {
      gridDrivers.filter((d) => d.team === teamPref).forEach((d) => nums.push(d.number));
    }
    return nums;
  }, [driverPref, teamPref, gridDrivers]);

  const latestRace = isCurrentYear
    ? (sessions.find((s) => s.status === "completed" && s.sessionType === "Race") ??
       sessions.find((s) => s.status === "completed"))
    : null;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return sessions
      .filter((s) => s.status !== "upcoming")
      .filter((s) => !latestRace || s.sessionKey !== latestRace.sessionKey)
      .filter((s) => {
        if (!q) return true;
        return (
          (s.raceName ?? s.country).toLowerCase().includes(q) ||
          s.circuit.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.sessionType.toLowerCase().includes(q)
        );
      })
      .filter((s) => typeFilter === "All" || s.sessionType === typeFilter)
      .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());
  }, [sessions, query, typeFilter, latestRace]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by GP, circuit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-foreground/30 cursor-pointer"
        >
          {SESSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <YearSelector current={year} />

        <div className="flex gap-2">
          {loadingGrid ? (
            <>
              <div className="h-[42px] w-24 rounded-lg bg-foreground/5 animate-pulse" />
              <div className="h-[42px] w-24 rounded-lg bg-foreground/5 animate-pulse" />
            </>
          ) : (
            <>
              <DriverPicker drivers={gridDrivers} value={driverPref} onChange={handleDriverChange} />
              <TeamPicker teams={teams} value={teamPref} onChange={handleTeamChange} />
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted">
        Should you watch in full or just catch the highlights? No spoilers — just data.
      </p>

      {sessions.length === 0 && apiError && (
        <div className="text-center py-24 text-muted">
          <p className="text-4xl mb-4">📡</p>
          <p className="text-lg font-semibold text-foreground">Race data temporarily unavailable</p>
          <p className="text-sm mt-1">The OpenF1 API may be busy — this often happens right after a race finishes. Try again in a few minutes.</p>
        </div>
      )}

      {sessions.length === 0 && !apiError && (
        <div className="text-center py-24 text-muted">
          <p className="text-4xl mb-4">🏁</p>
          <p className="text-lg font-semibold text-foreground">No sessions found for {year}</p>
          <p className="text-sm mt-1">Try a different year.</p>
        </div>
      )}

      {latestRace && (
        <section>
          <SessionCard session={latestRace} isHero preferredNums={preferredNums} />
        </section>
      )}

      {filtered.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
            {year} Season
          </h2>
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <SessionCard key={s.sessionKey} session={s} preferredNums={preferredNums} />
            ))}
          </div>
        </section>
      )}

      {sessions.length > 0 && filtered.length === 0 && latestRace && (
        <div className="text-center py-16 text-muted text-sm">No sessions match your search.</div>
      )}
    </div>
  );
}
