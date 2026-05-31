const BASE = "https://api.jolpi.ca/ergast/f1";

interface JolpicaRace {
  round: string;
  raceName: string;
  Circuit: { Location: { country: string } };
  date: string; // YYYY-MM-DD (race day)
}

interface JolpicaResponse {
  MRData: { RaceTable: { Races: JolpicaRace[] } };
}

export interface CalendarRace {
  round: number;
  country: string;
  raceName: string;
  date: string;
}

export async function getCalendar(year: number): Promise<CalendarRace[]> {
  try {
    const res = await fetch(`${BASE}/${year}.json`, {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: JolpicaResponse = await res.json();
    return data.MRData.RaceTable.Races.map((r) => ({
      round: parseInt(r.round, 10),
      country: r.Circuit.Location.country,
      raceName: r.raceName,
      date: r.date,
    }));
  } catch {
    return [];
  }
}

export function matchCalendarRound(
  sessionDate: string,
  calendar: CalendarRace[]
): CalendarRace | undefined {
  const t = new Date(sessionDate).getTime();
  const WINDOW = 8 * 24 * 3600 * 1000;
  let best: CalendarRace | undefined;
  let bestDiff = WINDOW + 1;
  for (const r of calendar) {
    const diff = Math.abs(t - new Date(r.date).getTime());
    if (diff <= WINDOW && diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  }
  return best;
}
