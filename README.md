# Shall I Watch The Race?

Spoiler-free verdict on every F1 race and sprint: **Worth Watching** or **Highlights Only**.

**[shalliwatchtherace.com](https://shalliwatchtherace.com)**

---

## What it does

You finished a race weekend late. You want to know if it's worth clearing two hours, or whether a five-minute highlights reel covers it — without anyone telling you what happened.

This tool scores each race entirely on what happened on track, never on who won or where anyone finished. You get a verdict and a score. No spoilers.

## How it scores

Four signals, each capped to prevent any one factor dominating:

| Signal | Cap |
|---|---|
| Race incidents (safety cars, red flags) | 25 pts |
| On-track action (positions gained on track) | 40 pts |
| Weather (sustained wet conditions) | 15 pts |
| Strategy (genuinely varied pit stop counts) | 10 pts |

Raw score is normalised against a benchmark of 65 — calibrated so a race with a safety car, a lead battle, and solid overtaking scores 6–8/10. A score of **4.0 or above** earns Worth Watching; below that it's Highlights Only.

The full scoring logic, point values, normalisation formula, personalisation, and known limitations are all public:

- [Algorithm page](https://shalliwatchtherace.com/algorithm) — interactive breakdown
- [Whitepaper](https://shalliwatchtherace.com/whitepaper) — full technical specification

## What it never uses

Finishing positions, driver names, lap times, or results of any kind. Data comes from [OpenF1](https://openf1.org) (race control events, anonymised telemetry) and [Jolpica/Ergast](https://api.jolpi.ca) (calendar). Both are free public APIs — no keys required.

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- TypeScript + Tailwind CSS
- Deployed on Vercel

## Running locally

```bash
npm install
npm run dev
```

No environment variables needed.

## Tests

```bash
npm test
```

Scoring engine unit tests via Vitest.
