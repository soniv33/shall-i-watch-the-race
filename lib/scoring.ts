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

export function scScore(events: OpenF1RaceControl[]): { pts: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let pts = 0;

  const sc = events.filter(
    (e) =>
      e.category === "SafetyCar" &&
      e.message?.toLowerCase().includes("deployed") &&
      !e.message?.toLowerCase().includes("virtual")
  ).length;

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
    if (range > 8 && rainFraction === 0) {
      pts += 5;
      factors.push({ label: "Changing track", emoji: "🌡️" });
    }
  }

  return { pts: Math.min(15, pts), factors };
}

export function positionScore(positions: OpenF1Position[]): { pts: number; factors: ScoreFactor[]; notableDrivers: number[] } {
  if (!positions.length) return { pts: 0, factors: [], notableDrivers: [] };

  const sorted = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPos = new Map<number, number>();
  const lastPos = new Map<number, number>();
  const worstPos = new Map<number, number>();
  const leaders = new Set<number>();

  for (const p of sorted) {
    if (!firstPos.has(p.driver_number)) {
      firstPos.set(p.driver_number, p.position);
      worstPos.set(p.driver_number, p.position);
    }
    lastPos.set(p.driver_number, p.position);

    if (p.position > (worstPos.get(p.driver_number) ?? 0))
      worstPos.set(p.driver_number, p.position);

    if (p.position === 1) leaders.add(p.driver_number);
  }

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

  const max = Math.max(...stops);
  const avg = stops.reduce((a, b) => a + b, 0) / stops.length;

  let pts = 0;
  const factors: ScoreFactor[] = [];

  if (max >= 3 || avg > 2) {
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
  year: number
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
    const { pts, factors, notableDrivers: nd } = positionScore(posResult.value);
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
    !isPractice && score >= 4.0 ? "race" : "highlights";

  const partial = [rcResult, wxResult, posResult, pitResult].some(
    (r) => r.status === "rejected"
  );

  return { sessionKey, verdict, score, factors: allFactors.map((f) => f.label), notableDrivers, partial };
}
