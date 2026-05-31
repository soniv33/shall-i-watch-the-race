import { NextRequest, NextResponse } from "next/server";
import { buildStory } from "@/lib/story";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionKey: string }> }) {
  const { sessionKey } = await params;
  try {
    const story = await buildStory(Number(sessionKey));
    return NextResponse.json(story, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
