"use client";

interface Props {
  score: number;
}

export default function ScoreBar({ score }: Props) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#6b7280";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-mono font-semibold text-foreground/80 w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
