import { SessionStatus } from "./types";

// OpenF1 backfills race data (positions, race control, pits) for a while after
// the chequered flag, so scores computed straight away come out under-counted.
// Hold sessions in "justFinished" for 2 hours after date_end before scoring.
const SETTLE_MS = 1000 * 60 * 60 * 2;

export function mapSessionStatus(dateStart: string, dateEnd: string): SessionStatus {
  const now = Date.now();
  const start = new Date(dateStart).getTime();
  const end = new Date(dateEnd || dateStart).getTime();
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  if (now <= end + SETTLE_MS) return "justFinished";
  return "completed";
}
