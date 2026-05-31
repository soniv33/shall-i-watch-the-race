# Shall I Watch The Race? — Scoring Algorithm

**Version:** 1.0  
**Author:** Vishal Soni  
**Site:** shalliwatchtherace.com  

---

## Overview

Each Formula 1 race receives a score from 0–10, derived from four data signals sourced from the OpenF1 API. The score is compared against a threshold to produce a binary verdict: **Watch** or **Highlights**.

No finishing positions, driver names, lap times, or championship standings are used. The system is intentionally spoiler-free.

---

## Verdict threshold

| Score | Verdict |
|-------|---------|
| ≥ 4.5 | Watch |
| < 4.5 | Highlights |

---

## Scoring components

### 1. Race incidents (max 25 pts)

Sourced from the OpenF1 `/race_control` endpoint.

| Event | Points | Cap |
|-------|--------|-----|
| Safety car deployed | 10 per deployment | 20 |
| Virtual safety car deployed | 4 per deployment | 8 |
| Red flag | 12 per flag | 12 |
| Combined total | — | 25 |

Detection logic:
- Safety car: `category = "SafetyCar"`, message contains `"deployed"` but not `"virtual"`
- Virtual safety car: `category = "SafetyCar"`, message contains both `"virtual"` and `"deployed"`
- Red flag: `category = "Flag"`, `flag = "RED"`

---

### 2. Weather (max 15 pts)

Sourced from the OpenF1 `/weather` endpoint.

**Rain scoring** is proportional to the fraction of readings that recorded rainfall > 0:

| Fraction of rainy readings | Points |
|---------------------------|--------|
| ≥ 40% | 15 |
| 10–40% | 7 |
| ≤ 10% | 0 |

A binary "any rain = 15 pts" approach was rejected because passing showers at circuits like Interlagos produced the same score as genuinely wet races.

**Track temperature swing:** If no rain was recorded and the track temperature range across the session exceeds 8°C, 5 additional points are awarded (capped at the component maximum of 15).

---

### 3. On-track action (max 40 pts)

Sourced from the OpenF1 `/position` endpoint.

Position records are sorted chronologically. For each driver, three values are tracked:
- `firstPos` — position at first recorded appearance
- `lastPos` — position at last recorded appearance  
- `worstPos` — highest position number (furthest back) seen during the race

**Unique leaders:** Any driver who appears in P1 at any point is added to a leaders set. Each unique leader contributes 6 pts.

**Forward movers:** A driver is a forward mover if `firstPos - lastPos ≥ 5` (gained 5 or more places net). Each forward mover contributes 2 pts.

Only forward movers are counted. Drivers who lost positions — including retirements, which can produce swings of 10–15 places — are excluded to avoid inflating the score with attrition that does not reflect race excitement.

**Recovery drive signal:** A driver who fell 10+ places from their starting position but finished within 2 places of where they started is also counted as a mover, even if their net position change is small. This captures drives that the net-position metric misses entirely.

**Formula:**

```
position_pts = min(40, unique_leaders × 6 + forward_movers × 2)
```

---

### 4. Pit strategy (max 10 pts)

Sourced from the OpenF1 `/pit` endpoint.

10 points are awarded only when pit stop counts are genuinely varied across the field:

| Condition | Points |
|-----------|--------|
| Any driver made ≥ 3 stops | 10 |
| Field average > 2 stops | 10 |
| Otherwise | 0 |

A two-stop tier was evaluated but removed. Modern F1 sees most fields averaging 1.5–2 stops as a baseline, so awarding points for standard two-stop races did not meaningfully differentiate exciting strategy battles from routine ones.

---

## Normalisation

Raw points from all four components are summed and normalised:

```
score = min(10, round((raw / 65) × 10, 1))
```

The benchmark of 65 was chosen empirically. The theoretical maximum is 90 pts (25 + 15 + 40 + 10), but this is essentially unreachable in practice. A genuinely exciting race — featuring a safety car, a lead battle, and meaningful overtaking — typically produces 35–55 raw points. Normalising against 65 places such a race in the 5–8 range on a 10-point scale, which aligns with intuitive expectations.

---

## Cancelled race filtering

Two layers prevent cancelled or phantom sessions from appearing:

1. **Jolpica gate (primary):** Each OpenF1 session is matched against the official Jolpica/Ergast F1 calendar using a closest-match algorithm within an 8-day window. Sessions with no calendar match are discarded. Closest-match (not first-match) is essential for back-to-back weekends fewer than 8 days apart.

2. **Lap data check (secondary):** For races completed within the last 60 days, the OpenF1 `/laps` endpoint is queried. A race must have ≥ 10 drivers recorded on lap 1 to be considered valid. This catches the narrow case of a cancelled session that falls within the 8-day matching window of a legitimate round.

Historical seasons (older than 60 days) rely on the Jolpica gate alone, avoiding the latency cost of making 20+ concurrent API requests per season load.

---

## Data sources

| Source | Endpoint | Used for |
|--------|----------|----------|
| OpenF1 | `/sessions` | Session discovery |
| OpenF1 | `/race_control` | Safety car, red flag events |
| OpenF1 | `/weather` | Rainfall and temperature readings |
| OpenF1 | `/position` | Driver position telemetry |
| OpenF1 | `/pit` | Pit stop records |
| OpenF1 | `/laps` | Cancelled race detection |
| Jolpica/Ergast | `/{year}.json` | Official calendar, round numbers, race names |

---

## Known limitations

- **Sparse telemetry:** OpenF1 position data is not sampled at a fixed rate. Gaps in coverage mean some genuine lead changes may not appear in the data, slightly underweighting lead-battle scores.
- **Pit stop lead changes:** Drivers who lead briefly during pit cycles are counted toward `unique_leaders`. This can inflate the leaders count in races where the front runners cycle through stops without genuine on-track battles.
- **No subjective signals:** Narrative elements — a dramatic final lap, a championship-deciding collision, a landmark result — are invisible to the model. The system will always have false negatives for races that were significant for contextual rather than on-track reasons.
- **Championship context:** A last-lap overtake between title contenders carries more significance than the same move between mid-field runners. The algorithm has no awareness of standings.
- **Grid-position signal quality:** First-recorded telemetry position is used as a grid-position proxy. Drivers who start from the pit lane or receive pre-race penalties may have an inaccurate starting reference, slightly over-reporting forward movement.
- **Close battles without overtakes:** Wheel-to-wheel racing that does not result in a position change goes undetected.
- **Strategy interpretation:** The pit-strategy signal rewards high stop counts but does not model undercut/overcut sequences or tyre-compound divergence.
