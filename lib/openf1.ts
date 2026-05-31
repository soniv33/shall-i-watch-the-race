const BASE = "https://api.openf1.org/v1";

// Sessions list is fresh data; historical data (positions, weather etc.) can be cached longer
const CACHE_TTL: Record<string, number> = {
  "/sessions": 120,   // 2 minutes — we want near-real-time session availability
  "/meetings": 300,
};
const DEFAULT_TTL = 3600;

async function get<T>(path: string, params: Record<string, string | number> = {}, timeoutMs = 8000): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      next: { revalidate: CACHE_TTL[path] ?? DEFAULT_TTL },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  country_name: string;
  circuit_short_name: string;
  location: string;
  date_start: string;
  date_end: string;
  year: number;
  meeting_key: number;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface OpenF1RaceControl {
  date: string;
  message: string;
  category: string;
  flag: string | null;
  lap_number: number | null;
  session_key: number;
}

export interface OpenF1Weather {
  date: string;
  rainfall: number;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  session_key: number;
}

export interface OpenF1Pit {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  session_key: number;
}

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_number: number;
  year: number;
}

export function getSessions(year: number) {
  return get<OpenF1Session[]>("/sessions", { year });
}

export function getMeetings(year: number) {
  return get<OpenF1Meeting[]>("/meetings", { year });
}

export function getPositions(sessionKey: number) {
  return get<OpenF1Position[]>("/position", { session_key: sessionKey });
}

export function getRaceControl(sessionKey: number) {
  return get<OpenF1RaceControl[]>("/race_control", { session_key: sessionKey });
}

export function getWeather(sessionKey: number) {
  return get<OpenF1Weather[]>("/weather", { session_key: sessionKey });
}

export function getPitStops(sessionKey: number) {
  return get<OpenF1Pit[]>("/pit", { session_key: sessionKey });
}

export interface OpenF1Driver {
  driver_number: number;
  last_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  session_key: number;
}

export function getDrivers(sessionKey: number) {
  return get<OpenF1Driver[]>("/drivers", { session_key: sessionKey });
}

export async function hasLapData(sessionKey: number): Promise<boolean> {
  try {
    const data = await get<unknown[]>("/laps", { session_key: sessionKey, lap_number: 1 });
    // Require ≥10 drivers recorded on lap 1. Real races have ~20 starters; cancelled
    // races have zero lap records. The threshold distinguishes them without needing
    // to know the session outcome.
    return Array.isArray(data) && data.length >= 10;
  } catch {
    return false;
  }
}
