import { describe, it, expect } from "vitest";
import { scScore, weatherScore, positionScore, pitScore } from "./scoring";
import type { OpenF1RaceControl, OpenF1Weather, OpenF1Position, OpenF1Pit } from "./openf1";

// ── helpers ─────────────────────────────────────────────────────────────────────────────

function rc(category: string, message: string, flag: string | null = null): OpenF1RaceControl {
  return { category, message, flag, date: "2025-01-01T00:00:00", lap_number: 1, session_key: 1 };
}

function weather(rainfall: number, track_temperature: number): OpenF1Weather {
  return { rainfall, track_temperature, air_temperature: 25, humidity: 50, date: "2025-01-01T00:00:00", session_key: 1 };
}

function pos(driverNum: number, position: number, lap: number): OpenF1Position {
  return {
    driver_number: driverNum,
    position,
    date: new Date(Date.UTC(2025, 10, 2, 14, lap, 0)).toISOString(),
    session_key: 1,
  };
}

function makePit(driverNum: number, stop: number): OpenF1Pit {
  return { driver_number: driverNum, lap_number: stop * 20, pit_duration: 25, session_key: 1 };
}

function grid(order: number[], lap: number): OpenF1Position[] {
  return order.map((d, i) => pos(d, i + 1, lap));
}

// ── Safety car / red flag scoring ─────────────────────────────────────────────

describe("scScore", () => {
  it("returns 0 for a clean race", () => {
    expect(scScore([]).pts).toBe(0);
  });

  it("scores 10 pts for one safety car", () => {
    const { pts } = scScore([rc("SafetyCar", "SAFETY CAR DEPLOYED")]);
    expect(pts).toBe(10);
  });

  it("scores 20 pts for two safety cars (SC cap)", () => {
    const { pts } = scScore([
      rc("SafetyCar", "SAFETY CAR DEPLOYED"),
      rc("SafetyCar", "SAFETY CAR DEPLOYED"),
    ]);
    expect(pts).toBe(20);
  });

  it("scores 4 pts for a virtual safety car", () => {
    const { pts } = scScore([rc("SafetyCar", "VIRTUAL SAFETY CAR DEPLOYED")]);
    expect(pts).toBe(4);
  });

  it("does not double-count a VSC as a regular SC", () => {
    const { pts } = scScore([rc("SafetyCar", "VIRTUAL SAFETY CAR DEPLOYED")]);
    expect(pts).toBeLessThan(10);
  });

  it("scores 12 pts for a red flag", () => {
    const { pts } = scScore([rc("Flag", "RED FLAG", "RED")]);
    expect(pts).toBe(12);
  });

  it("caps combined incidents at 25 pts", () => {
    const events = [
      rc("SafetyCar", "SAFETY CAR DEPLOYED"),
      rc("SafetyCar", "SAFETY CAR DEPLOYED"),
      rc("SafetyCar", "SAFETY CAR DEPLOYED"),
      rc("Flag", "RED FLAG", "RED"),
    ];
    expect(scScore(events).pts).toBe(25);
  });
});

// ── Weather scoring ───────────────────────────────────────────────────

describe("weatherScore", () => {
  it("returns 0 for dry stable conditions", () => {
    const data = [weather(0, 40), weather(0, 42), weather(0, 41)];
    expect(weatherScore(data).pts).toBe(0);
  });

  it("scores 15 pts for sustained rain (40%+ of readings)", () => {
    const data = [weather(0.8, 22), weather(0.5, 21), weather(0.3, 21), weather(0.1, 22), weather(0, 23)];
    expect(weatherScore(data).pts).toBe(15);
  });

  it("scores 7 pts for a brief shower (10–40% of readings)", () => {
    const data = [
      weather(0, 40), weather(0, 40), weather(0, 40), weather(0, 40),
      weather(0.2, 38), weather(0.1, 37),
      weather(0, 40), weather(0, 40), weather(0, 40), weather(0, 40),
    ];
    expect(weatherScore(data).pts).toBe(7);
  });

  it("scores 0 pts for a negligible drizzle (≤10% of readings)", () => {
    const data = Array.from({ length: 20 }, (_, i) => weather(i === 5 ? 0.05 : 0, 40));
    expect(weatherScore(data).pts).toBe(0);
  });

  it("scores 5 pts for large track temperature swing in dry conditions", () => {
    const data = [weather(0, 30), weather(0, 42)];
    expect(weatherScore(data).pts).toBe(5);
  });

  it("does not add temp swing bonus when it is raining", () => {
    const data = [
      ...Array.from({ length: 8 }, () => weather(0.5, 22)),
      weather(0, 32), weather(0, 35),
    ];
    expect(weatherScore(data).pts).toBe(15);
  });
});

// ── Position / on-track action scoring ─────────────────────────────────────

describe("positionScore", () => {
  it("returns 0 for empty data", () => {
    expect(positionScore([]).pts).toBe(0);
  });

  it("scores a dominant race (1 leader, no big movers) low", () => {
    const positions = [
      ...grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0),
      ...grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90),
    ];
    const { pts } = positionScore(positions);
    expect(pts).toBe(6);
  });

  it("credits a driver who gains 5+ places forward", () => {
    const positions = [
      ...grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 99, 13, 14, 15], 0),
      ...grid([1, 2, 3, 4, 99, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 90),
    ];
    const { pts } = positionScore(positions);
    expect(pts).toBe(8);
  });

  it("does NOT count DNF drivers as big movers (Mexico 2025 bug)", () => {
    const start = [1, 2, 3, 5, 4, 14, 6, 7, 27, 8, 9, 99, 11, 12, 13, 15, 16, 17, 18, 19];
    const end   = [1, 2, 3, 99, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 5, 14, 27, 18, 19];
    const positions = [...grid(start, 0), ...grid(end, 90)];

    const { pts, notableDrivers } = positionScore(positions);
    expect(pts).toBe(8);
    expect(notableDrivers).not.toContain(5);
    expect(notableDrivers).not.toContain(14);
    expect(notableDrivers).not.toContain(27);
    expect(notableDrivers).toContain(99);
  });

  it("scores lead changes as the dominant signal", () => {
    const positions = [
      ...grid([4, 2, 3, 1, 5], 0),
      ...grid([2, 4, 3, 1, 5], 30),
      ...grid([1, 2, 3, 4, 5], 60),
      ...grid([1, 2, 3, 4, 5], 90),
    ];
    const { pts } = positionScore(positions);
    expect(pts).toBeGreaterThanOrEqual(18);
  });

  it("catches a recovery drive even when net position is unchanged", () => {
    const positions = [
      pos(99, 3, 0),
      pos(99, 15, 20),
      pos(99, 8, 50),
      pos(99, 4, 90),
    ];
    const { pts } = positionScore(positions);
    expect(pts).toBeGreaterThan(0);
  });

  it("notableDrivers includes race leader even with no net position change", () => {
    const positions = [
      ...grid([1, 2, 3, 4, 5], 0),
      ...grid([1, 2, 3, 4, 5], 90),
    ];
    const { notableDrivers } = positionScore(positions);
    expect(notableDrivers).toContain(1);
    expect(notableDrivers).not.toContain(2);
    expect(notableDrivers).not.toContain(3);
  });

  it("notableDrivers includes recovery drive driver", () => {
    const positions = [
      pos(99, 3, 0),
      pos(99, 16, 20),
      pos(99, 9, 50),
      pos(99, 4, 90),
    ];
    const { notableDrivers } = positionScore(positions);
    expect(notableDrivers).toContain(99);
  });

  it("caps position score at 40 pts", () => {
    const manyLeaders = [1, 2, 3, 4, 5, 6, 7];
    const startOrder  = [1, 2, 3, 4, 5, 6, 7, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
    const endOrder    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const positions = [
      ...grid(startOrder, 0),
      ...manyLeaders.map((d, i) => pos(d, 1, 10 + i * 5)),
      ...grid(endOrder, 90),
    ];

    expect(positionScore(positions).pts).toBeLessThanOrEqual(40);
  });
});

// ── Pit strategy scoring ──────────────────────────────────────────────────

describe("pitScore", () => {
  it("returns 0 for an empty pit list", () => {
    expect(pitScore([]).pts).toBe(0);
  });

  it("returns 0 for a standard 1-stop race (avg ≈ 1, max = 1)", () => {
    const pits = Array.from({ length: 10 }, (_, i) => makePit(i + 1, 1));
    expect(pitScore(pits).pts).toBe(0);
  });

  it("scores 10 pts when someone pits 3 times (aggressive strategy)", () => {
    const pits = [
      ...Array.from({ length: 9 }, (_, i) => makePit(i + 1, 1)),
      makePit(99, 1), makePit(99, 2), makePit(99, 3),
    ];
    expect(pitScore(pits).pts).toBe(10);
  });

  it("scores 10 pts when average stops exceeds 2", () => {
    const pits = Array.from({ length: 10 }, (_, i) => [makePit(i + 1, 1), makePit(i + 1, 2), makePit(i + 1, 3)]).flat();
    const { pts } = pitScore(pits);
    expect(pts).toBe(10);
  });
});

// ── Full scoring scenarios ───────────────────────────────────────────────

describe("combined scoring — race scenarios", () => {
  it("Mexico 2025-style race: processional front, DNF attrition → low score", () => {
    const rcEvents: OpenF1RaceControl[] = [];
    const wx = [weather(0, 38), weather(0, 39), weather(0, 40)];
    const startOrder = [4, 1, 3, 5, 2, 14, 6, 7, 27, 8, 9, 99, 11, 12, 13, 15, 16, 17, 18, 10];
    const endOrder   = [4, 1, 3, 99, 2, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 10, 18, 5, 14, 27];
    const positions  = [...grid(startOrder, 0), ...grid(endOrder, 90)];
    const pits = Array.from({ length: 20 }, (_, i) => makePit(i + 1, 1));

    const sc  = scScore(rcEvents).pts;
    const wx_ = weatherScore(wx).pts;
    const pos = positionScore(positions).pts;
    const pit = pitScore(pits).pts;

    const raw = sc + wx_ + pos + pit;
    const score = Math.min(10, Math.round((raw / 65) * 100) / 10);

    expect(score).toBeLessThan(4.5);
  });

  it("exciting race: SC + lead battle + forward movers → Watch", () => {
    const rcEvents = [rc("SafetyCar", "SAFETY CAR DEPLOYED")];
    const wx = [weather(0, 38), weather(0, 40)];
    const startOrder = [1, 2, 3, 20, 19, 18, 17, 16, 15, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const midOrder   = [2, 1, 3, 20, 19, 18, 17, 16, 15, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const endOrder   = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const positions = [
      ...grid(startOrder, 0),
      ...grid(midOrder, 40),
      ...grid(endOrder, 90),
    ];
    const pits = Array.from({ length: 20 }, (_, i) => makePit(i + 1, 1));

    const sc  = scScore(rcEvents).pts;
    const wx_ = weatherScore(wx).pts;
    const pos = positionScore(positions).pts;
    const pit = pitScore(pits).pts;

    const raw = sc + wx_ + pos + pit;
    const score = Math.min(10, Math.round((raw / 65) * 100) / 10);

    expect(score).toBeGreaterThanOrEqual(4.5);
  });

  it("rain race without safety car → Watch from weather + action alone", () => {
    const rcEvents: OpenF1RaceControl[] = [];
    const wx = Array.from({ length: 10 }, (_, i) => weather(i < 7 ? 0.8 : 0, 22));
    const startOrder = [1, 2, 3, 10, 9, 8, 7, 6, 5, 4];
    const endOrder   = [2, 1, 3, 4, 5, 6, 7, 8, 9, 10];
    const positions  = [...grid(startOrder, 0), ...grid(endOrder, 90)];
    const pits = Array.from({ length: 10 }, (_, i) => makePit(i + 1, 1));

    const raw =
      scScore(rcEvents).pts +
      weatherScore(wx).pts +
      positionScore(positions).pts +
      pitScore(pits).pts;

    const score = Math.min(10, Math.round((raw / 65) * 100) / 10);
    expect(score).toBeGreaterThanOrEqual(4.5);
  });

  it("truly processional race → well below Watch threshold", () => {
    const rcEvents: OpenF1RaceControl[] = [];
    const wx = [weather(0, 40), weather(0, 41)];
    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const positions = [...grid(order, 0), ...grid(order, 90)];
    const pits = Array.from({ length: 10 }, (_, i) => makePit(i + 1, 1));

    const raw =
      scScore(rcEvents).pts +
      weatherScore(wx).pts +
      positionScore(positions).pts +
      pitScore(pits).pts;

    const score = Math.min(10, Math.round((raw / 65) * 100) / 10);
    expect(score).toBeLessThan(2.0);
  });
});
