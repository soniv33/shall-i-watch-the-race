import { NextRequest, NextResponse } from "next/server";
import { getSessions, getDrivers } from "@/lib/openf1";
import { GridDriver } from "@/lib/types";

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  try {
    const sessions = await getSessions(year);
    const race = sessions
      .filter((s) => s.session_name === "Race" && s.date_end)
      .find((s) => new Date(s.date_end).getTime() < Date.now());

    if (!race) return NextResponse.json([]);

    const raw = await getDrivers(race.session_key);
    const seen = new Set<number>();
    const drivers: GridDriver[] = raw
      .filter((d) => {
        if (seen.has(d.driver_number)) return false;
        seen.add(d.driver_number);
        return true;
      })
      .map((d) => ({
        number: d.driver_number,
        name: d.full_name,
        acronym: d.name_acronym,
        team: d.team_name,
      }))
      .sort((a, b) => a.team.localeCompare(b.team) || a.number - b.number);

    return NextResponse.json(drivers, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
