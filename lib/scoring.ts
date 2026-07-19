import {
  getRaceControl,
  getWeather,
  getPositions,
  getPitStops,
  OpenF1RaceControl,
  OpenF1Weather,
  OpenF1Position,
  OpenF1Pit,
} from "./openf1";
import { SessionScore, Verdict } from "./types";

interface ScoreFactor { label: string; emoji: string; }

// ── helpers ──────────────────────────────────────────────────────────────────────────

// Re-deployments of the safety car within this window are the same incident
// (e.g. an immediate second deployment after a failed restart), not new drama.
const SC_MERGE_MS = 10 * 60 * 1000;

function countIncidents(dates: string[]): number {
  const times = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  let incidents = 0;
  let last = -Infinity;
  for (const t of times) {
    if (t - last > SC_MERGE_MS) incidents++;
    last = t;
  }
  return incidents;
}

export function scScore(events: OpenF1RaceControl[]): { pts: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let pts = 0;

  const sc = countIncidents(
    events
      .filter(
        (e) =>
          e.category === "SafetyCar" &&
          e.message?.toLowerCase().includes("deployed") &&
          !e.message?.toLowerCase().includes("virtual")
      )
      .map((e) => e.date)
  );

  const vsc = events.filter(
    (e) =>
      e.category === "SafetyCar" &&
      e.message?.toLowerCase().includes("virtual") &&
      e.message?.toLowerCase().includes("deployed")
  ).length;

  // Require category "Flag" to avoid matching deleted lap times etc.
  const red = events.filter(
    (e) => e.category === "Flag" && e.flag === "RED"
  ).length;

  if (sc > 0) {
    pts += Math.min(20, sc * 10);
    factors.push({ label: sc > 1 ? `${sc}× safety car` : "Safety car", emoji: "🚗" });
  }
  if (vsc > 0) {
    pts += Math.min(8, vsc * 4);
    factors.push({ label: "Virtual SC", emoji: "🟡" });
  }
  if (red > 0) {
    pts += Math.min(12, red * 12);
    factors.push({ label: red > 1 ? `${red}× red flag` : "Red flag", emoji: "🔴" });
  }

  return { pts: Math.min(25, pts), factors };
}

export function weatherScore(data: OpenF1Weather[]): { pts: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let pts = 0;

  const rainyReadings = data.filter((w) => (w.rainfall ?? 0) > 0).length;
  const rainFraction = data.length > 0 ? rainyReadings / data.length : 0;

  if (rainFraction >= 0.4) {
    pts += 15;
    factors.push({ label: "Wet conditions", emoji: "🌧️" });
  } else if (rainFraction > 0.1) {
    pts += 7;
    factors.push({ label: "Brief rain", emoji: "🌦️" });
  }

  const temps = data.map((w) => w.track_temperature).filter(Boolean);
  if (temps.length > 1) {
    const range = Math.max(...temps) - Math.min(...temps);
    // >12°C: a normal afternoon drifts ~10°C at some circuits without affecting racing
    if (range > 12 && rainFraction === 0) {
      pts += 5;
      factors.push({ label: "Changing track", emoji: "🌡️" });
    }
  }

  return { pts: Math.min(15, pts), factors };
}

// A driver only counts as a leader after holding P1 for this much cumulative race
// time. Filters out lap-1 scrambles and pit-cycle/SC shuffles where someone
// "leads" for a couple of minutes without a single on-track pass happening.
const SUSTAINED_LEAD_MS = 5 * 60 * 1000;

function sustainedLeaders(sorted: OpenF1Position[], raceStart: number): Set<number> {
  // Position data is change-based: a P1 record means that driver led from that
  // moment until the next P1 record. Clamp to raceStart so the pre-race grid
  // snapshot doesn't credit the pole sitter with an hour in the "lead".
  const end = sorted.length
    ? new Date(sorted[sorted.length - 1].date).getTime()
    : raceStart;
  const changes: { driver: number; t: number }[] = [];
  for (const p of sorted) {
    if (p.position !== 1) continue;
    if (!changes.length || changes[changes.length - 1].driver !== p.driver_number) {
      changes.push({ driver: p.driver_number, t: new Date(p.date).getTime() });
    }
  }

  const held = new Map<number, number>();
  for (let i = 0; i < changes.length; i++) {
    const from = Math.max(changes[i].t, raceStart);
    const to = Math.max(i + 1 < changes.length ? changes[i + 1].t : end, raceStart);
    held.set(changes[i].driver, (held.get(changes[i].driver) ?? 0) + Math.max(0, to - from));
  }

  const leaders = new Set<number>();
  for (const [driver, ms] of held) if (ms >= SUSTAINED_LEAD_MS) leaders.add(driver);
  return leaders;
}

export function positionScore(
  positions: OpenF1Position[],
  dateStart?: string
): { pts: number; factors: ScoreFactor[]; notableDrivers: number[] } {
  if (!positions.length) return { pts: 0, factors: [], notableDrivers: [] };

  const sorted = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPos = new Map<number, number>();
  const lastPos = new Map<number, number>();
  const worstPos = new Map<number, number>();

  for (const p of sorted) {
    if (!firstPos.has(p.driver_number)) {
      firstPos.set(p.driver_number, p.position);
      worstPos.set(p.driver_number, p.position);
    }
    lastPos.set(p.driver_number, p.position);

    if (p.position > (worstPos.get(p.driver_number) ?? 0))
      worstPos.set(p.driver_number, p.position);
  }

  const raceStart = dateStart
    ? new Date(dateStart).getTime()
    : new Date(sorted[0].date).getTime();
  const leaders = sustainedLeaders(sorted, raceStart);
  const uniqueLeaders = leaders.size;

  let bigMovers = 0;
  const notableDrivers = new Set<number>(leaders);

  for (const [driver, first] of firstPos) {
    const last = lastPos.get(driver) ?? first;
    const worst = worstPos.get(driver) ?? first;
    const netMove = first - last >= 5;
    const recovery = worst - first >= 10 && Math.abs(last - first) <= 2;
    if (netMove || recovery) {
      bigMovers++;
      notableDrivers.add(driver);
    }
  }

  const pts = Math.min(40, uniqueLeaders * 6 + bigMovers * 2);

  const factors: ScoreFactor[] = [];
  if (uniqueLeaders >= 3) factors.push({ label: "Lead battle", emoji: "🏆" });
  else if (uniqueLeaders === 2) factors.push({ label: "Lead change", emoji: "🏆" });
  if (bigMovers >= 6) factors.push({ label: "High action", emoji: "⚡" });
  else if (bigMovers >= 3) factors.push({ label: "Some overtakes", emoji: "🏴" });

  return { pts, factors, notableDrivers: [...notableDrivers] };
}

export function pitScore(pits: OpenF1Pit[]): { pts: number; factors: ScoreFactor[] } {
  const byDriver = new Map<number, number>();
  for (const p of pits) byDriver.set(p.driver_number, (byDriver.get(p.driver_number) ?? 0) + 1);

  const stops = [...byDriver.values()];
  if (!stops.length) return { pts: 0, factors: [] };

  const avg = stops.reduce((a, b) => a + b, 0) / stops.length;

  let pts = 0;
  const factors: ScoreFactor[] = [];

  // Field average only: a single driver on 3 stops is damage or a penalty,
  // not a strategic race
  if (avg > 2) {
    pts = 10;
    factors.push({ label: "Strategic race", emoji: "🔧" });
  }

  return { pts, factors };
}

// ── main export ──────────────────────────────────────────────────────────────────────────

export async function computeScore(
  sessionKey: number,
  sessionType: string,
  country: string,
  year: number,
  dateStart?: string
): Promise<SessionScore> {
  const isRace = ["Race", "Sprint"].includes(sessionType);
  const isPractice = sessionType.startsWith("Practice");

  const [rcResult, wxResult, posResult, pitResult] =
    await Promise.allSettled([
      getRaceControl(sessionKey),
      getWeather(sessionKey),
      isRace ? getPositions(sessionKey) : Promise.resolve([] as OpenF1Position[]),
      isRace ? getPitStops(sessionKey) : Promise.resolve([] as OpenF1Pit[]),
    ]);

  const allFactors: ScoreFactor[] = [];
  let raw = 0;
  let notableDrivers: number[] = [];

  if (rcResult.status === "fulfilled") {
    const { pts, factors } = scScore(rcResult.value);
    raw += pts;
    allFactors.push(...factors);
  }

  if (wxResult.status === "fulfilled") {
    const { pts, factors } = weatherScore(wxResult.value);
    raw += pts;
    allFactors.push(...factors);
  }

  if (isRace && posResult.status === "fulfilled") {
    const { pts, factors, notableDrivers: nd } = positionScore(posResult.value, dateStart);
    raw += pts;
    allFactors.push(...factors);
    notableDrivers = nd;
  }

  if (isRace && pitResult.status === "fulfilled") {
    const { pts, factors } = pitScore(pitResult.value);
    raw += pts;
    allFactors.push(...factors);
  }

  const ceiling = isRace ? 65 : isPractice ? 40 : 65;
  const score = Math.min(10, Math.round((raw / ceiling) * 100) / 10);

  const verdict: Verdict =
    !isPractice && score >= 6.0 ? "race" : "highlights";

  const partial = [rcResult, wxResult, posResult, pitResult].some(
    (r) => r.status === "rejected"
  );

  return { sessionKey, verdict, score, factors: allFactors.map((f) => f.label), notableDrivers, partial };
}
