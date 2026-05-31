import { F1Session } from "./types";

export function sessionSlug(s: Pick<F1Session, "year" | "country" | "sessionType">): string {
  const country = s.country.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const type = s.sessionType.toLowerCase(); // "race" | "sprint"
  return `${s.year}-${country}-${type}`;
}

export function findBySlug(sessions: F1Session[], slug: string): F1Session | undefined {
  return sessions.find((s) => sessionSlug(s) === slug);
}
