import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "@/lib/openf1";
import { F1Session } from "@/lib/types";
import { mapSessionStatus } from "@/lib/sessionStatus";

const ALLOWED = new Set(["Race", "Sprint"]);

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  try {
    const raw = await getSessions(year);

    const sessions: F1Session[] = raw
      .filter((s) => s.date_start && ALLOWED.has(s.session_name))
      .map((s) => ({
        sessionKey: s.session_key,
        sessionName: s.session_name,
        sessionType: s.session_name as "Race" | "Sprint",
        country: s.country_name,
        circuit: s.circuit_short_name,
        location: s.location,
        dateStart: s.date_start,
        dateEnd: s.date_end ?? s.date_start,
        year: s.year,
        meetingKey: s.meeting_key,
        status: mapSessionStatus(s.date_start, s.date_end ?? s.date_start),
      }))
      .sort(
        (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
      );

    return NextResponse.json(sessions, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 502 });
  }
}
