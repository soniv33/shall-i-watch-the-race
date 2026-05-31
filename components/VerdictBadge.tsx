"use client";

import { Verdict } from "@/lib/types";

interface Props {
  verdict: Verdict;
  large?: boolean;
  forYou?: boolean;
}

export default function VerdictBadge({ verdict, large, forYou }: Props) {
  const isRace = verdict === "race";
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span
        className={`
          inline-block font-display font-black tracking-widest uppercase
          ${large ? "text-3xl px-5 py-2" : "text-sm px-3 py-1"}
          ${isRace
            ? "bg-race/10 text-race border border-race/30"
            : "bg-highlights/10 text-highlights border border-highlights/30"
          }
          rounded
        `}
      >
        {isRace ? "Worth Watching" : "Highlights Only"}
      </span>
      {forYou && isRace && (
        <span className="text-[10px] text-muted/60 tracking-wide pr-0.5">for you</span>
      )}
    </span>
  );
}
