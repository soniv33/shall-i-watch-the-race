import Link from "next/link";
import { getSessions, hasLapData } from "@/lib/openf1";
import { getCalendar, matchCalendarRound } from "@/lib/jolpica";
import { F1Session, SessionType } from "@/lib/types";
import { mapSessionStatus } from "@/lib/sessionStatus";
import { settleWithConcurrency } from "@/lib/concurrency";
import HomeContent from "@/components/HomeContent";
import ThemeToggle from "@/components/ThemeToggle";

export const revalidate = 300;

const ALLOWED_SESSIONS = new Set(["Race", "Sprint"]);

const SESSION_TYPE_MAP: Record<string, SessionType> = {
  Race: "Race",
  Sprint: "Sprint",
};

type FetchSessionsResult = { sessions: F1Session[]; apiError: boolean };

async function fetchSessions(year: number): Promise<FetchSessionsResult> {
  try {
    const [raw, calendar] = await Promise.all([getSessions(year), getCalendar(year).catch(() => [])]);

    const mapped = raw
      .filter((s) => s.date_start && ALLOWED_SESSIONS.has(s.session_name))
      .filter((s) => {
        if (!s.date_end) return false;
        const dur = new Date(s.date_end).getTime() - new Date(s.date_start).getTime();
        return dur >= 30 * 60 * 1000;
      })
      .map((s) => ({
        sessionKey: s.session_key,
        sessionName: s.session_name,
        sessionType: SESSION_TYPE_MAP[s.session_name] ?? (s.session_name as SessionType),
        country: s.country_name,
        circuit: s.circuit_short_name,
        location: s.location ?? s.country_name,
        dateStart: s.date_start,
        dateEnd: s.date_end ?? s.date_start,
        year: s.year,
        meetingKey: s.meeting_key,
        status: mapSessionStatus(s.date_start, s.date_end ?? s.date_start),
      }))
      .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());

    const calendarHasData = calendar.length > 0;
    const roundByMeeting = new Map<number, number>();
    const raceNameByMeeting = new Map<number, string>();

    if (calendarHasData) {
      for (const s of mapped) {
        if (!roundByMeeting.has(s.meetingKey)) {
          const match = matchCalendarRound(s.dateStart, calendar);
          if (match) {
            roundByMeeting.set(s.meetingKey, match.round);
            raceNameByMeeting.set(s.meetingKey, match.raceName);
          }
        }
      }
    } else {
      const raceMeetings = [...mapped]
        .filter((s) => s.sessionType === "Race")
        .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
        .map((s) => s.meetingKey);
      [...new Set(raceMeetings)].forEach((mk, i) => roundByMeeting.set(mk, i + 1));
    }

    const withRounds = mapped
      .filter((s) => !calendarHasData || roundByMeeting.has(s.meetingKey))
      .map((s) => ({
        ...s,
        round: roundByMeeting.get(s.meetingKey),
        raceName: raceNameByMeeting.get(s.meetingKey),
      }));

    const completedRaces = withRounds.filter((s) => s.sessionType === "Race" && s.status === "completed");

    // Check the whole current season, not a rolling window: cancelled races (e.g.
    // Bahrain/Saudi 2026) must stay hidden after they age out. Past seasons are
    // never filtered — OpenF1 has data gaps for real historical races.
    const currentSeason = year === new Date().getFullYear();
    const lapCheckCandidates = currentSeason ? completedRaces : [];
    // Use allSettled, not all: a failed check (timeout/rate-limit from OpenF1) must
    // never be treated the same as a confirmed "no lap data" result — that would
    // intermittently hide real races whenever the /laps request has a hiccup.
    // Cap concurrency instead of firing every check at once — OpenF1 rate-limits
    // bursts, and that's what was causing checks to fail in the first place.
    const lapChecks = await settleWithConcurrency(lapCheckCandidates, 4, (s) => hasLapData(s.sessionKey));
    const cancelledMeetings = new Set(
      lapCheckCandidates
        .filter((_, i) => lapChecks[i].status === "fulfilled" && lapChecks[i].value === false)
        .map((s) => s.meetingKey)
    );
    return { sessions: withRounds.filter((s) => !cancelledMeetings.has(s.meetingKey)), apiError: false };
  } catch {
    return { sessions: [], apiError: true };
  }
}

async function fetchBestSessions(
  requested: number
): Promise<{ sessions: F1Session[]; year: number; apiError: boolean }> {
  const result = await fetchSessions(requested);
  if (result.sessions.length > 0) return { ...result, year: requested };
  // Only fall back to the previous year if the API responded (no error) but had no data
  if (result.apiError) return { sessions: [], year: requested, apiError: true };
  const prev = requested - 1;
  const prevResult = await fetchSessions(prev);
  return { ...prevResult, year: prev };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.year ?? new Date().getFullYear());
  const { sessions, year, apiError } = await fetchBestSessions(requested);
  const isCurrentYear = year === new Date().getFullYear();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border sticky top-0 z-10 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-foreground font-display font-black text-lg tracking-tight hover:opacity-80 transition-opacity">Shall I Watch <span className="text-f1red">the Race?</span></Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/about" className="text-muted hover:text-foreground transition-colors text-xs">How it works</Link>
              <Link href="/algorithm" className="text-muted hover:text-foreground transition-colors text-xs">Algorithm</Link>
              <Link href="/whitepaper" className="text-muted hover:text-foreground transition-colors text-xs">Whitepaper</Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <HomeContent sessions={sessions} year={year} isCurrentYear={isCurrentYear} apiError={apiError} />
      </main>

      <footer className="border-t border-border mt-16 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 text-xs text-muted">
          <div className="flex items-center justify-between">
            <span>© Vishal Soni</span>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-foreground transition-colors">How it works</Link>
              <Link href="/algorithm" className="hover:text-foreground transition-colors">Algorithm</Link>
            </div>
          </div>
          <p className="text-muted/60">Data: OpenF1 API · Spoiler-free · Scores update after each race weekend</p>
        </div>
      </footer>
    </div>
  );
}
