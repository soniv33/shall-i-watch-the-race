import { getRaceControl, getPositions, getDrivers } from "@/lib/openf1";
import type { RacePhase, RaceBattle, RaceStory } from "@/lib/types";

export type { RacePhase, RaceBattle, RaceStory };

function phaseExcitement(name: string): "calm" | "active" | "intense" {
  if (name === "Red Flag") return "intense";
  if (name === "Safety Car" || name === "Virtual Safety Car" || name === "Restart") return "active";
  return "calm";
}

export async function buildStory(sessionKey: number): Promise<RaceStory> {
  const [rcEvents, positions, drivers] = await Promise.all([
    getRaceControl(sessionKey).catch(() => []),
    getPositions(sessionKey).catch(() => []),
    getDrivers(sessionKey).catch(() => []),
  ]);

  const driverMap = new Map<number, string>();
  for (const d of drivers) driverMap.set(d.driver_number, d.last_name);

  const lapNumbers = rcEvents
    .map((e) => e.lap_number)
    .filter((n): n is number => n != null && n > 0);
  const totalLaps = lapNumbers.length > 0 ? Math.max(...lapNumbers) : 0;

  // --- Phase detection ---
  interface PhaseBoundary { lapStart: number; name: string; }
  const boundaries: PhaseBoundary[] = [{ lapStart: 1, name: "Opening" }];

  for (const evt of rcEvents) {
    const lap = evt.lap_number ?? 0;
    if (lap <= 0) continue;
    const msg = (evt.message ?? "").toUpperCase();
    const cat = (evt.category ?? "").toUpperCase();
    const flag = (evt.flag ?? "").toUpperCase();

    if (flag === "RED") {
      boundaries.push({ lapStart: lap, name: "Red Flag" });
    } else if (cat === "SAFETYCAR" || msg.includes("SAFETY CAR")) {
      if (msg.includes("VIRTUAL") || msg.includes("VSC")) {
        boundaries.push({ lapStart: lap, name: "Virtual Safety Car" });
      } else if (msg.includes("DEPLOYED") || msg.includes("SAFETY CAR OUT")) {
        boundaries.push({ lapStart: lap, name: "Safety Car" });
      } else if (msg.includes("RESTART") || msg.includes("GREEN")) {
        boundaries.push({ lapStart: lap, name: "Restart" });
      }
    }
  }

  const seenLaps = new Set<number>();
  const uniqueBoundaries = boundaries
    .sort((a, z) => a.lapStart - z.lapStart)
    .filter((b) => {
      if (seenLaps.has(b.lapStart)) return false;
      seenLaps.add(b.lapStart);
      return true;
    });

  const phases: RacePhase[] = uniqueBoundaries.map((b, i) => ({
    name: b.name,
    lapStart: b.lapStart,
    lapEnd:
      i + 1 < uniqueBoundaries.length
        ? uniqueBoundaries[i + 1].lapStart - 1
        : totalLaps || b.lapStart,
    events: [],
    excitement: phaseExcitement(b.name),
  }));

  if (phases.length > 1) phases[phases.length - 1].name = "Final Stint";

  // --- Battle detection: count position swaps between consecutive snapshots ---
  const battles: RaceBattle[] = [];

  if (positions.length > 0) {
    const sorted = [...positions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startTime = new Date(sorted[0].date).getTime();
    const bucketMs = 60_000;

    const bucketMap = new Map<number, Map<number, number>>();
    for (const pos of sorted) {
      const bucket = Math.floor((new Date(pos.date).getTime() - startTime) / bucketMs);
      if (!bucketMap.has(bucket)) bucketMap.set(bucket, new Map());
      bucketMap.get(bucket)!.set(pos.driver_number, pos.position);
    }

    const snapshots = [...bucketMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, snap]) => snap);

    const swapCounts = new Map<string, number>();

    for (let i = 0; i + 1 < snapshots.length; i++) {
      const curr = snapshots[i];
      const next = snapshots[i + 1];
      const nums = [...new Set([...curr.keys(), ...next.keys()])];

      for (let a = 0; a < nums.length; a++) {
        for (let b = a + 1; b < nums.length; b++) {
          const dA = nums[a], dB = nums[b];
          const cA = curr.get(dA), cB = curr.get(dB);
          const nA = next.get(dA), nB = next.get(dB);
          if (cA == null || cB == null || nA == null || nB == null) continue;
          // Ignore backmarkers
          if (cA > 15 || cB > 15) continue;
          // Only count if they were close before the swap (not a pit-stop position drop)
          if (Math.abs(cA - cB) > 2) continue;
          if ((cA < cB) !== (nA < nB)) {
            const key = dA < dB ? `${dA}:${dB}` : `${dB}:${dA}`;
            swapCounts.set(key, (swapCounts.get(key) ?? 0) + 1);
          }
        }
      }
    }

    for (const [key, overtakes] of swapCounts.entries()) {
      const [dAStr, dBStr] = key.split(":");
      battles.push({
        driverA: driverMap.get(Number(dAStr)) ?? dAStr,
        driverB: driverMap.get(Number(dBStr)) ?? dBStr,
        overtakes,
      });
    }

    battles.sort((a, b) => b.overtakes - a.overtakes);
  }

  return { totalLaps, phases, battles: battles.slice(0, 3) };
}
