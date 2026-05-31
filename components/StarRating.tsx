"use client";

const LABELS: [number, string][] = [
  [9,   "Classic"],
  [7.5, "Entertaining"],
  [6,   "Watchable"],
  [4,   "Forgettable"],
  [0,   "Skip it"],
];

function label(score: number) {
  return LABELS.find(([min]) => score >= min)?.[1] ?? "Skip it";
}

interface Props {
  score: number;   // 0–10
  large?: boolean;
}

export default function StarRating({ score, large }: Props) {
  // Convert 0–10 to 0–5 in 0.5 steps
  const wheels = Math.round((score / 10) * 5 * 2) / 2;
  const full   = Math.floor(wheels);
  const half   = wheels % 1 !== 0;
  const empty  = 5 - full - (half ? 1 : 0);
  const text   = label(score);

  const sz  = large ? "text-3xl" : "text-base";
  const lsz = large ? "text-sm font-semibold" : "text-xs";

  const icons = [
    ...Array.from({ length: full },  (_, i) => ({ key: `f${i}`, opacity: 1 })),
    ...(half ? [{ key: "h", opacity: 0.5 }] : []),
    ...Array.from({ length: empty }, (_, i) => ({ key: `e${i}`, opacity: 0.2 })),
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`${sz} leading-none flex gap-0.5`} aria-label={`${wheels} out of 5 wheels`}>
        {icons.map(({ key, opacity }) => (
          <span key={key} style={{ opacity }}>🛞</span>
        ))}
      </span>
      <span className={`${lsz} text-muted uppercase tracking-widest`}>{text}</span>
    </div>
  );
}
