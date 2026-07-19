import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Algorithm — Shall I Watch The Race?",
  description: "Full technical specification of the scoring algorithm behind the Watch vs Highlights verdict.",
};

export default function AlgorithmPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border sticky top-0 z-10 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted hover:text-foreground transition-colors text-sm">← Home</Link>
            <span className="text-border">|</span>
            <Link href="/" className="text-foreground font-display font-black text-lg tracking-tight hover:opacity-80 transition-opacity">Shall I Watch <span className="text-f1red">the Race?</span></Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
            Algorithm specification
          </h1>
          <p className="text-muted text-sm">
            A complete technical description of how sessions are scored, verdicts assigned, and
            personalisation applied.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Overview</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-foreground/60 leading-relaxed">
              Each completed session is evaluated against four independent signals — race incidents,
              weather, on-track position changes, and pit strategy. Each signal contributes a bounded
              number of raw points. The total is normalised to a 0–10 scale against a calibrated
              ceiling. Sessions that reach a threshold score receive a <span className="text-race">Worth Watching</span> verdict;
              those that fall short receive <span className="text-highlights">Highlights Only</span>. An optional
              personalisation layer can upgrade a Highlights Only result to Worth Watching for fans of a driver who
              featured prominently in that session, but never downgrades a Worth Watching verdict.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">The four signals</h2>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-foreground/60 font-semibold">Signal</th>
                  <th className="text-left px-5 py-3 text-foreground/60 font-semibold">What triggers it</th>
                  <th className="text-right px-5 py-3 text-foreground/60 font-semibold">Max pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-5 py-3 text-foreground font-medium">Race incidents</td>
                  <td className="px-5 py-3 text-foreground/50">Safety car incidents (10 pts each, cap 20) — deployments within 10 minutes count as one incident. Virtual safety cars (4 pts each, cap 8), red flags (12 pts each, cap 12). Combined cap 25.</td>
                  <td className="px-5 py-3 text-foreground/80 text-right font-mono">25</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-foreground font-medium">Weather</td>
                  <td className="px-5 py-3 text-foreground/50">Sustained rain (&ge;40% of readings): 15 pts. Brief shower (10–40%): 7 pts. Dry with track temperature swing &gt;12°C: 5 pts.</td>
                  <td className="px-5 py-3 text-foreground/80 text-right font-mono">15</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-foreground font-medium">Position changes</td>
                  <td className="px-5 py-3 text-foreground/50">6 pts per sustained leader — a driver who held P1 for at least 5 cumulative minutes of race time, so lap-1 scrambles and pit-cycle blips don't count. 2 pts per driver who gains 5+ places net, or triggers the recovery drive signal. Cap 40.</td>
                  <td className="px-5 py-3 text-foreground/80 text-right font-mono">40</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-foreground font-medium">Pit strategy</td>
                  <td className="px-5 py-3 text-foreground/50">10 pts when the field averages more than 2 stops per driver. A single driver on 3+ stops (damage, penalties) no longer triggers it. Zero for standard 1- or 2-stop races.</td>
                  <td className="px-5 py-3 text-foreground/80 text-right font-mono">10</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-foreground/[0.02]">
                  <td colSpan={2} className="px-5 py-3 text-foreground/40 text-xs">Theoretical maximum (essentially unreachable in practice)</td>
                  <td className="px-5 py-3 text-foreground/80 text-right font-mono font-semibold">90</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Normalisation and verdict threshold</h2>
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <p className="text-sm text-foreground/60 leading-relaxed">
              The raw point total is normalised against a ceiling of <span className="text-foreground/80">65 points</span> for
              races and sprints (40 for practice sessions, which have no position or pit signals).
              The formula is:
            </p>
            <div className="rounded-lg bg-foreground/5 border border-border px-4 py-3 font-mono text-sm text-foreground/80">
              score = round(raw / 65 × 10, 1)&nbsp;&nbsp;·&nbsp;&nbsp;capped at 10
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed">
              The ceiling of 65 was chosen because a genuinely exciting race — one safety car,
              multiple lead changes, and solid overtaking — produces roughly 45–50 raw points, which
              normalises to 6–8 out of 10. The theoretical maximum of 90 is unreachable in practice,
              so anchoring to 90 would compress all real scores into a narrow 5–6 band.
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed">
              A session scores a <span className="text-race">Worth Watching</span> verdict when it reaches{
              " "}<span className="text-foreground/80">6.0 or above</span>. Below that threshold the verdict
              is <span className="text-highlights">Highlights Only</span>. Practice sessions always receive
              Highlights Only regardless of score.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Personalisation layer</h2>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">How it works</span>
              <p className="text-sm text-foreground/60 leading-relaxed">
                When a user selects a favourite driver, sessions where that driver featured notably
                can be upgraded from <span className="text-highlights">Highlights Only</span> to{
                " "}<span className="text-race">Worth Watching</span>. The upgrade is shown with a small
                "for you" label so users can distinguish personalised verdicts from algorithmic ones.
                A Worth Watching verdict is never downgraded — personalisation only upgrades.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">What qualifies as notable</span>
              <p className="text-sm text-foreground/60 leading-relaxed">
                A driver is added to the <code className="text-foreground/80 bg-foreground/5 px-1 rounded text-xs">notableDrivers</code> list
                for a session if any of the following apply:
              </p>
              <ul className="flex flex-col gap-2 text-sm text-foreground/60 list-none">
                <li className="flex gap-2">
                  <span className="text-f1red mt-0.5 shrink-0">—</span>
                  <span><span className="text-foreground/80">Race leader:</span> the driver held P1 at any point in the session.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-f1red mt-0.5 shrink-0">—</span>
                  <span><span className="text-foreground/80">Forward mover:</span> the driver gained 5 or more positions net from their starting position to their finishing position. Retirements are excluded — a driver who drops to last due to a DNF is not a forward mover.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-f1red mt-0.5 shrink-0">—</span>
                  <span><span className="text-foreground/80">Recovery drive:</span> the driver fell 10 or more positions from their starting position at some point in the race but ultimately finished within 2 places of where they started. This captures genuine come-back drives that the net-movement signal would miss.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-foreground/60 leading-relaxed">
                The <code className="text-foreground/80 bg-foreground/5 px-1 rounded text-xs">notableDrivers</code> list
                is computed inside the position-scoring module and stored alongside the session score.
                The personalisation check happens at render time in the client — no server round-trip
                is needed after the score is fetched. Favourite driver preference is stored in
                <code className="text-foreground/80 bg-foreground/5 px-1 rounded text-xs ml-1">localStorage</code> under
                the key <code className="text-foreground/80 bg-foreground/5 px-1 rounded text-xs">siwr-favourite-driver</code> and
                never sent to any server.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Cancelled race filtering</h2>
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <p className="text-sm text-foreground/60 leading-relaxed">
              Sessions are filtered through two independent gates before appearing in the guide:
            </p>
            <ul className="flex flex-col gap-2 text-sm text-foreground/60 list-none">
              <li className="flex gap-2">
                <span className="text-f1red mt-0.5 shrink-0">1.</span>
                <span>
                  <span className="text-foreground/80">Jolpica calendar gate:</span> each session's
                  meeting date is matched against the official F1 calendar from the Jolpica API.
                  Sessions that fall outside the calendar (phantom events, test sessions published
                  as races) are silently dropped. The closest-match logic correctly handles
                  back-to-back weekends fewer than 8 days apart.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-f1red mt-0.5 shrink-0">2.</span>
                <span>
                  <span className="text-foreground/80">hasLapData check:</span> for recently-completed
                  races (within 60 days), a secondary check verifies that OpenF1 holds lap data for
                  the session. This catches the narrow case of a cancelled session that passes the
                  calendar gate because it falls within 8 days of a real race. Historical seasons
                  skip this check to avoid mass timeouts from concurrent requests.
                </span>
              </li>
            </ul>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Both gates must pass for a session to be displayed. A session that fails either gate
              is excluded from the grid along with all other sessions from the same meeting.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Known limitations</h2>
          <div className="flex flex-col gap-3">
            {[
              {
                title: "Sparse telemetry",
                body: "OpenF1 position data is polled at roughly 1–3 Hz. At this resolution, short-duration overtakes (especially at pit exit or in the final lap) may not be captured. Scores for closely-contested races may be slightly understated.",
              },
              {
                title: "Pit-cycle lead changes",
                body: "When drivers run different pit strategies, the race leader on-track changes every time a front-runner pits. These virtual lead changes inflate the unique-leaders count and therefore the position score. A dominant performance with two clear strategy phases can score similarly to a genuine on-track battle.",
              },
              {
                title: "No narrative signals",
                body: "The algorithm has no awareness of championship stakes, last-lap drama, team orders, driver rivalries, or on-board radio. A statistically quiet race that delivers a memorable moment on the final lap will still receive a Highlights Only verdict.",
              },
              {
                title: "Sprint session calibration",
                body: "Sprints use the same ceiling and threshold as full races despite being shorter and structurally less likely to produce multiple lead changes. Sprint verdicts should be read as a relative signal within their shorter format, not compared directly to full race scores.",
              },
              {
                title: "Championship context",
                body: "A last-lap overtake between title contenders carries more significance than the same move between mid-field runners. The algorithm has no awareness of standings.",
              },
              {
                title: "Grid-position signal quality",
                body: "First-recorded telemetry position is used as a grid-position proxy. Drivers who start from the pit lane or receive pre-race penalties may have an inaccurate starting reference, slightly over-reporting forward movement.",
              },
              {
                title: "Close battles without overtakes",
                body: "Wheel-to-wheel racing that does not result in a position change goes undetected. A race decided by millimetres on the final lap scores the same as a processional one.",
              },
              {
                title: "Strategy interpretation",
                body: "The pit-strategy signal rewards high stop counts but does not model undercut/overcut sequences or tyre-compound divergence.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">{title}</span>
                <p className="text-sm text-foreground/50">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground/60">
              Want the full formal specification with mathematical notation, proofs, and references?
            </p>
            <Link
              href="/whitepaper"
              className="shrink-0 text-sm text-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              Read the whitepaper →
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">Data sources</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-foreground/60 leading-relaxed">
              All race data comes from{
              " "}
              <a
                href="https://openf1.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
              >
                OpenF1
              </a>
              , a free and open real-time F1 data API. Calendar data is sourced from{
              " "}
              <a
                href="https://jolpi.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
              >
                Jolpica
              </a>
              . No official F1 data feeds are used. No finishing positions, lap times, or results
              of any kind are consumed — the algorithm operates entirely on race control messages,
              weather readings, position telemetry, and pit timing.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16 py-6 px-4">
        <div className="max-w-3xl mx-auto text-xs text-muted">
          <p>© Vishal Soni · Data: OpenF1 API · Spoiler-free</p>
        </div>
      </footer>
    </div>
  );
}
