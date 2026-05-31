export type SessionType = "Race" | "Sprint";

export interface GridDriver {
  number: number;
  name: string;
  acronym: string;
  team: string;
}

export type Verdict = "race" | "highlights";
export type SessionStatus = "completed" | "live" | "upcoming";

export interface F1Session {
  sessionKey: number;
  sessionName: string;
  sessionType: SessionType;
  country: string;
  circuit: string;
  location: string;
  raceName?: string;
  dateStart: string;
  dateEnd: string;
  year: number;
  meetingKey: number;
  status: SessionStatus;
  round?: number;
}

export interface SessionScore {
  sessionKey: number;
  verdict: Verdict;
  score: number;
  factors?: string[];
  notableDrivers?: number[];
}

export interface RacePhase {
  name: string;
  lapStart: number;
  lapEnd: number;
  events: string[];
  excitement: "calm" | "active" | "intense";
}

export interface RaceBattle {
  driverA: string;
  driverB: string;
  overtakes: number;
}

export interface RaceStory {
  totalLaps: number;
  phases: RacePhase[];
  battles: RaceBattle[];
}
