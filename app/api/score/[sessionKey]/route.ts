import { NextRequest, NextResponse } from "next/server";
import { computeScore } from "@/lib/scoring";

// In-memory cache to avoid re-scoring within the same serverless instance
const cache = new Map<string, { score: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionKey: string }> }
) {
  const { sessionKey } = await params;
  const key = Number(sessionKey);
  const country = req.nextUrl.searchParams.get("country") ?? "";
  const year = Number(req.nextUrl.searchParams.get("year") ?? 2025);
  const sessionType = req.nextUrl.searchParams.get("type") ?? "Race";
  const dateStart = req.nextUrl.searchParams.get("start") ?? undefined;

  if (!key || isNaN(key)) {
    return NextResponse.json({ error: "Invalid sessionKey" }, { status: 400 });
  }

  const cacheKey = `${key}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.score, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const score = await computeScore(key, sessionType, country, year, dateStart);
    if (!score.partial) {
      cache.set(cacheKey, { score, ts: Date.now() });
    }

    return NextResponse.json(score, {
      headers: { "X-Cache": "MISS" },
    });
  } catch {
    return NextResponse.json({ error: "Scoring failed" }, { status: 502 });
  }
}
