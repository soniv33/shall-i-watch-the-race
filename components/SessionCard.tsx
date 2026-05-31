"use client";

import { useEffect, useState } from "react";
import { F1Session, SessionScore } from "@/lib/types";
import VerdictBadge from "./VerdictBadge";

function displayName(session: F1Session): string {
  const base = session.raceName ?? `${session.location} Grand Prix`;
  return session.sessionType === "Sprint" ? base.replace("Grand Prix", "Sprint") : base;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TYPE_COLOR: Record<string, string> = {
  Race: "bg-f1red/20 text-f1red",
  Sprint: "bg-purple-500/20 text-purple-400",
};

export default function SessionCard({
  session,
  isHero = false,
  preferredNums = [],
}: {
  session: F1Session;
  isHero?: boolean;
  preferredNums?: number[];
}) {
  const [score, setScore] = useState<SessionScore | null>(null);
  const [loading, setLoading] = useState(session.status === "completed");

  useEffect(() => {
    if (session.status !== "completed") { setLoading(false); return; }
    const ctrl = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const doFetch = (isRetry = false) => {
      const params = new URLSearchParams({
        country: session.country,
        year: String(session.year),
        type: session.sessionType,
      });
      fetch(`/api/score/${session.sessionKey}?${params}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(data => {
          if (data && typeof data.score === "number") {
            if (data.partial && !isRetry) {
              // First attempt used incomplete OpenF1 data — retry once after a short
              // wait so the concurrent request burst can subside and the Data Cache warms up
              retryTimer = setTimeout(() => doFetch(true), 3000);
            } else {
              setScore(data as SessionScore);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    };

    doFetch();
    return () => {
      ctrl.abort();
      if (retryTimer !== null) clearTimeout(retryTimer);
    };
  }, [session]);

  const isPersonalised =
    preferredNums.length > 0 &&
    score?.notableDrivers != null &&
    preferredNums.some((n) => score.notableDrivers!.includes(n));

  const personalisedVerdict =
    score && score.verdict === "highlights" && isPersonalised
      ? ("race" as const)
      : score?.verdict ?? null;
  const forYou = personalisedVerdict === "race" && score?.verdict === "highlights";

  const typeColor = TYPE_COLOR[session.sessionType] ?? "bg-zinc-500/20 text-zinc-400";
  const name = displayName(session);

  if (isHero) {
    return (
      <div className="bg-card border border-border border-l-4 border-l-f1red rounded-xl px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="w-full max-w-xl">
          <p className="text-xs font-semibold text-f1red uppercase tracking-widest mb-1">Latest race</p>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColor}`}>
              {session.sessionType}
            </span>
            {session.status === "live" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-f1red/20 text-f1red animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-foreground leading-tight">
            {name}
          </h2>
          <p className="text-muted text-sm mt-1">
            {formatDate(session.dateStart)}
            {session.round != null && (
              <span className="ml-1.5 text-muted/60">· Round {session.round}</span>
            )}
          </p>
        </div>
        <div className="flex justify-center mt-2">
          {loading && <div className="h-10 w-28 rounded bg-foreground/5 animate-pulse" />}
          {!loading && score && personalisedVerdict && <VerdictBadge verdict={personalisedVerdict} large forYou={forYou} />}
          {!loading && !score && <span className="text-sm text-muted/40 italic">—</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4 hover:border-foreground/15 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColor}`}>
            {session.sessionType}
          </span>
          {session.status === "live" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-f1red/20 text-f1red animate-pulse">
              LIVE
            </span>
          )}
        </div>
        <h3 className="text-foreground font-semibold text-sm leading-tight truncate">{name}</h3>
        <p className="text-muted text-xs mt-0.5">
          {formatDate(session.dateStart)}
          {session.round != null && (
            <span className="ml-1 text-muted/60">· Rd {session.round}</span>
          )}
        </p>
      </div>

      {session.status === "completed" && (
        <div className="shrink-0">
          {loading && <div className="h-7 w-20 rounded bg-foreground/5 animate-pulse" />}
          {!loading && score && personalisedVerdict && <VerdictBadge verdict={personalisedVerdict} forYou={forYou} />}
          {!loading && !score && <span className="text-xs text-muted/40 italic">—</span>}
        </div>
      )}
    </div>
  );
}
