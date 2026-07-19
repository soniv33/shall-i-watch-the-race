import Link from "next/link";
import katex from "katex";
import "katex/dist/katex.min.css";
import PrintButton from "./PrintButton";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Technical Report — F1 Race Quality Scoring",
  description:
    "Spoiler-Free Race Quality Scoring for Formula 1: a data-driven approach to viewer recommendation.",
};

function M({ tex }: { tex: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: false }),
      }}
    />
  );
}

function MB({ tex }: { tex: string }) {
  return (
    <div
      className="overflow-x-auto py-1"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

export default function WhitepaperPage() {
  return (
    <>
      <style>{`
        .paper, .paper p, .paper li, .paper td, .paper th {
          font-family: Georgia, 'Times New Roman', Times, serif;
        }
        .paper p { text-align: justify; hyphens: auto; line-height: 1.7; }
        .paper .katex { font-size: 0.97em; }
        .paper .katex-display { margin: 1.2em 0; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .paper {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .paper-wrap { background: white !important; padding: 0 !important; }
          @page { size: A4; margin: 22mm 20mm 22mm 20mm; }
        }
      `}</style>

      <nav className="no-print border-b border-border sticky top-0 z-10 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted hover:text-foreground transition-colors text-sm">← Home</Link>
            <span className="text-border">|</span>
            <Link href="/algorithm" className="text-muted hover:text-foreground transition-colors text-sm">Algorithm</Link>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="paper-wrap min-h-screen bg-background py-10 px-4">
        <article className="paper bg-white text-[#111] max-w-[720px] mx-auto shadow-2xl px-[60px] py-[64px] print:shadow-none">

          <header className="text-center mb-8 pb-6 border-b-2 border-[#111]">
            <h1 className="text-[22px] font-bold leading-tight mb-3" style={{ fontFamily: "Georgia, serif" }}>
              Spoiler-Free Race Quality Scoring for Formula&nbsp;1
            </h1>
            <p className="text-[15px] text-[#444] mb-4" style={{ fontFamily: "Georgia, serif" }}>
              A Data-Driven Approach to Viewer Recommendation
            </p>
            <p className="text-[14px] font-semibold">Vishal Soni</p>
            <p className="text-[13px] text-[#555] mt-1">
              <em>shalliwatchtherace.com</em>
            </p>
            <p className="text-[12px] text-[#777] mt-3">Technical Report · v1.0 · May 2026</p>
          </header>

          <section className="mb-8">
            <p className="text-[13px] font-bold uppercase tracking-widest text-center mb-3">Abstract</p>
            <div className="border-t border-b border-[#ccc] py-4 px-4 bg-[#fafafa] text-[13.5px]">
              <p>
                We present a lightweight scoring system that classifies completed Formula&nbsp;1 race sessions
                as either <em>Watch</em> (worth viewing in full) or <em>Highlights</em> (adequately summarised
                by a short package), without revealing finishing positions, driver names, or any other
                spoiler-bearing information. Four telemetry-derived signals—race incident severity, ambient
                weather conditions, on-track position dynamics, and pit strategy variance—are combined into
                a normalised composite score from which a binary verdict is derived. An optional personalisation
                layer upgrades a <em>Highlights</em> verdict to <em>Watch</em> for users who follow a driver
                or constructor that was notably active in a session, but never downgrades a <em>Watch</em> verdict.
                All data are sourced from the public OpenF1 telemetry API.
              </p>
            </div>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">1. Introduction</h2>
            <p className="text-[13.5px] mb-3">
              Formula&nbsp;1 race broadcasts run for approximately two hours. Many viewers are unable or
              unwilling to commit this time without prior knowledge of whether a race was competitive.
              However, consulting conventional reviews or social media invariably reveals results, creating
              a binary choice between spoilers and blind viewing.
            </p>
            <p className="text-[13.5px] mb-3">
              This report describes the scoring algorithm underpinning <em>Shall I Watch The Race?</em>,
              a tool that resolves this tension by producing a verdict derived exclusively from process
              signals: how many times the safety car was deployed, whether it rained, how much movement
              occurred in the running order, and how varied the pit stop strategies were. None of these
              signals encodes a result. Positions are treated as anonymous integers; finishing order is
              never queried.
            </p>
            <p className="text-[13.5px]">
              The system is intentionally simple. Complex machine-learning approaches would require
              labelled training data (subjective viewer ratings) and would be less interpretable.
              The rule-based approach described here is fully auditable: every point awarded maps
              directly to a specific, observable race event.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">2. Data Sources</h2>
            <p className="text-[13.5px] mb-3">
              All race telemetry is retrieved from the OpenF1 public API
              (<em>openf1.org</em>). Four endpoints are consumed per session:
            </p>
            <table className="w-full text-[13px] border-collapse mb-3">
              <thead>
                <tr className="border-b-2 border-[#111]">
                  <th className="text-left py-1.5 pr-4 font-semibold">Endpoint</th>
                  <th className="text-left py-1.5 font-semibold">Data provided</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["/race_control", "Safety car, virtual safety car, and red flag events with timestamps"],
                  ["/weather", "Rainfall (mm), track temperature, and humidity at 1-minute intervals"],
                  ["/position", "Per-driver position values sampled every few seconds throughout the session"],
                  ["/pit", "Individual pit stop records with driver number and lap number"],
                ].map(([ep, desc]) => (
                  <tr key={ep} className="border-b border-[#ddd]">
                    <td className="py-1.5 pr-4 font-mono text-[12px] align-top whitespace-nowrap">{ep}</td>
                    <td className="py-1.5">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[13.5px]">
              Session metadata (calendar round, official race name) is sourced from the Jolpica/Ergast
              compatibility API. This is used solely for display purposes and does not influence scoring.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-4">3. Scoring Methodology</h2>
            <p className="text-[13.5px] mb-4">
              The total raw score <M tex="R" /> is the sum of four independent sub-scores, each capped
              at a fixed maximum:
            </p>
            <MB tex="R \;=\; S_{\text{incidents}} + S_{\text{weather}} + S_{\text{position}} + S_{\text{pit}}" />

            <table className="w-full text-[13px] border-collapse mb-5">
              <thead>
                <tr className="border-b-2 border-[#111]">
                  <th className="text-left py-1.5 pr-4 font-semibold">Signal</th>
                  <th className="text-right py-1.5 font-semibold">Cap (pts)</th>
                  <th className="text-right py-1.5 font-semibold">% of ceiling</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Race incidents", "25", "38%"],
                  ["Weather", "15", "23%"],
                  ["Position dynamics", "40", "62%"],
                  ["Pit strategy", "10", "15%"],
                ].map(([s, c, p]) => (
                  <tr key={s} className="border-b border-[#ddd]">
                    <td className="py-1.5">{s}</td>
                    <td className="py-1.5 text-right">{c}</td>
                    <td className="py-1.5 text-right text-[#666]">{p}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#111]">
                  <td className="py-1.5 font-semibold">Theoretical maximum</td>
                  <td className="py-1.5 text-right font-semibold">90</td>
                  <td className="py-1.5 text-right text-[#666]">—</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-[14px] font-bold mb-2">3.1 Race Control Events</h3>
            <p className="text-[13.5px] mb-3">
              Interruptions to normal racing—safety car (SC) deployments, virtual safety car (VSC)
              periods, and red flags—reliably indicate incidents that reshape the field. SC
              deployments occurring within a 10-minute window are merged into a single{
              " "}<em>incident</em>: an immediate re-deployment after a failed restart is the same
              disruption, not new drama. Let <M tex="n_{SC}" /> denote the merged incident count,
              with <M tex="n_{VSC}" /> and <M tex="n_{RF}" /> the raw counts of the other two
              event types observed in the race control feed:
            </p>
            <MB tex="S_{\text{incidents}} \;=\; \min\!\Bigl[\,\min(6\,n_{SC},\;12) \;+\; \min(4\,n_{VSC},\;8) \;+\; \min(12\,n_{RF},\;12),\;\;25\Bigr]" />
            <p className="text-[13.5px] mb-4">
              Safety cars are deliberately weighted below the on-track signals of Section 3.3: a
              deployment bunches the field and creates pit-stop divergence, but an interrupted race
              is not automatically an exciting one. Red flags carry the highest per-event weight, as
              a stoppage almost always reflects a major incident. The combined cap at 25 ensures
              on-track action must also be present for a high score.
            </p>

            <h3 className="text-[14px] font-bold mb-2">3.2 Weather Conditions</h3>
            <p className="text-[13.5px] mb-3">
              Let <M tex="N" /> denote the total number of weather readings for a session and define the
              wet-readings fraction:
            </p>
            <MB tex="r_w \;=\; \frac{\bigl|\{i : \mathrm{rainfall}_i > 0\}\bigr|}{N}" />
            <p className="text-[13.5px] mb-2">
              A piecewise function maps <M tex="r_w" /> to a rainfall score <M tex="f(r_w)" />:
            </p>
            <MB tex="f(r_w) \;=\; \begin{cases} 15 & r_w \;\geq\; 0.40 \\ 7 & 0.10 \;<\; r_w \;<\; 0.40 \\ 0 & r_w \;\leq\; 0.10 \end{cases}" />
            <p className="text-[13.5px] mb-3">
              The 10% lower bound prevents a brief shower—common at circuits such as Interlagos—from
              receiving the same score as a genuinely wet race. An additional 5-point bonus{
              " "}<M tex="g(\Delta T, r_w)" /> is awarded when track temperature swings exceed 12°C under dry
              conditions, capturing races where a cooling track changes tyre behaviour mid-race
              (an ordinary afternoon drifts ~10°C at some circuits without affecting the racing):
            </p>
            <MB tex="g(\Delta T,\, r_w) \;=\; \begin{cases} 5 & \Delta T > 12 \;\wedge\; r_w = 0 \\ 0 & \text{otherwise} \end{cases}" />
            <MB tex="S_{\text{weather}} \;=\; \min\!\bigl[f(r_w) + g(\Delta T, r_w),\;\;15\bigr]" />

            <h3 className="text-[14px] font-bold mb-2">3.3 On-Track Position Dynamics</h3>
            <p className="text-[13.5px] mb-3">
              The position telemetry stream is a time-ordered sequence of{
              " "}<M tex="(d, t, p)" /> triples where <M tex="d" /> is a driver number,{
              " "}<M tex="t" /> a timestamp, and <M tex="p" /> a position integer. For each driver{
              " "}<M tex="d \in D" />, define:
            </p>
            <ul className="list-none ml-4 mb-3 text-[13.5px] space-y-1">
              <li><M tex="p_d^{(0)}" /> — first recorded position (grid position proxy)</li>
              <li><M tex="p_d^{(T)}" /> — last recorded position (finishing position proxy)</li>
              <li><M tex="p_d^{*}" /> — maximum position value reached (worst point in race)</li>
            </ul>
            <p className="text-[13.5px] mb-2">
              A driver is a <em>forward mover</em> if they finished at least 5 places higher than
              they started (net gain only; retirements, which drop drivers to the back, do not qualify):
            </p>
            <MB tex="\phi(d) \;=\; \mathbf{1}\!\left[p_d^{(0)} - p_d^{(T)} \;\geq\; 5\right]" />
            <p className="text-[13.5px] mb-2">
              A driver is a <em>recovery drive</em> if they fell 10 or more positions from their
              grid slot yet finished within 2 places of where they started—indicating a dramatic
              mid-race comeback that the forward-mover signal misses (net change ≈ 0):
            </p>
            <MB tex="\rho(d) \;=\; \mathbf{1}\!\left[p_d^{*} - p_d^{(0)} \;\geq\; 10 \;\wedge\; \bigl|p_d^{(T)} - p_d^{(0)}\bigr| \;\leq\; 2\right]" />
            <p className="text-[13.5px] mb-2">
              Let <M tex="M" /> be the total mover count and <M tex="L" /> the number of{
              " "}<em>sustained leaders</em>: drivers whose cumulative time at P1 after the race
              start, <M tex="\tau_d" />, reaches at least 5 minutes. The threshold matters — a
              momentary P1 during a lap-1 scramble or a pit-stop cycle is a timing artifact, not a
              lead battle, and counting it systematically inflated scores at strategy-dominated
              circuits:
            </p>
            <MB tex="M \;=\; \sum_{d \in D}\!\left(\phi(d) \;\vee\; \rho(d)\right), \qquad L \;=\; \bigl|\!\bigl\{d \in D : \tau_d \;\geq\; 5\,\text{min}\bigr\}\bigr|" />
            <MB tex="S_{\text{position}} \;=\; \min\!\bigl(8L \;+\; 2M,\;\;40\bigr)" />
            <p className="text-[13.5px] mb-4">
              Lead changes (<M tex="L" />) are weighted four times higher than mover counts (<M tex="M" />)
              because a contested lead is the strongest indicator of a race worth watching in full.
            </p>

            <h3 className="text-[14px] font-bold mb-2">3.4 Pit Strategy Variance</h3>
            <p className="text-[13.5px] mb-3">
              Let <M tex="s_d" /> be the number of pit stops recorded for driver <M tex="d" />{
              " "}and <M tex="D" /> the set of drivers with at least one recorded stop:
            </p>
            <MB tex="\bar{s} \;=\; \frac{1}{|D|}\sum_{d \in D} s_d" />
            <MB tex="S_{\text{pit}} \;=\; \begin{cases} 10 & \bar{s} \;>\; 2 \\ 0 & \text{otherwise} \end{cases}" />
            <p className="text-[13.5px]">
              This signal captures races where genuinely varied strategy—some drivers taking two stops
              while others extend on one—creates diverging storylines. Only the field average is
              considered: a single driver making three or more stops is far more often evidence of
              damage or a penalty than of a strategic race, so per-driver maxima are ignored.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">4. Score Normalisation and Verdict Assignment</h2>
            <p className="text-[13.5px] mb-3">
              The raw score <M tex="R" /> is normalised against a calibration ceiling{
              " "}<M tex="C = 65" /> (rather than the theoretical maximum of 90) and rounded to one
              decimal place:
            </p>
            <MB tex="\sigma \;=\; \min\!\left(10,\;\;\operatorname{round}\!\left(\frac{R}{C} \times 100\right) \big/ 10\right)" />
            <p className="text-[13.5px] mb-3">
              The ceiling of 65 was calibrated so that a genuinely exciting race—containing a safety
              car deployment, multiple lead changes, and solid overtaking—scores approximately 6–8 out
              of 10. Setting <M tex="C = 90" /> (the theoretical maximum) compressed scores into a
              narrow range and made separation between races difficult. The binary verdict is then:
            </p>
            <MB tex="V \;=\; \begin{cases} \textit{Watch} & \sigma \;\geq\; 5.0 \\ \textit{Highlights} & \sigma \;<\; 5.0 \end{cases}" />
            <p className="text-[13.5px]">
              The threshold of 5.0 was chosen empirically. At this level a race needs genuine
              on-track action—a sustained lead battle, strong overtaking, or varied strategy—on
              top of any interruptions. Races whose points come mostly from safety cars land below
              the line: an interrupted race is not automatically an exciting one.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">5. Personalisation Layer</h2>
            <p className="text-[13.5px] mb-3">
              During scoring, the algorithm maintains a <em>notable driver set</em>{
              " "}<M tex="N \subseteq D" />:
            </p>
            <MB tex="N \;=\; \bigl\{d \in D : p_d^{(t)} = 1 \text{ for some } t\bigr\} \;\cup\; \bigl\{d \in D : \phi(d) \;\vee\; \rho(d)\bigr\}" />
            <p className="text-[13.5px] mb-3">
              For a user following driver set <M tex="D_u" /> (which may contain a single driver
              number or all driver numbers belonging to a followed constructor), the personalised
              verdict is:
            </p>
            <MB tex="\hat{V}(u) \;=\; \begin{cases} \textit{Watch} & V = \textit{Highlights} \;\wedge\; D_u \cap N \;\neq\; \emptyset \\ V & \text{otherwise} \end{cases}" />
            <p className="text-[13.5px]">
              Personalisation is strictly one-directional: a <em>Highlights</em> verdict may
              be upgraded to <em>Watch</em>, but a <em>Watch</em> verdict is never downgraded.
              The rationale is asymmetric: the cost of missing a race your favourite driver featured
              in is higher than the cost of watching an unremarkable race. An upgraded verdict is
              labelled <em>for you</em> in the interface to communicate that it reflects personal
              preference rather than general race quality.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">6. Data Quality and Cancelled Race Detection</h2>
            <p className="text-[13.5px] mb-3">
              The OpenF1 session feed occasionally contains phantom sessions—test entries or
              sessions that were created administratively but never ran. Two independent filters
              are applied before a session is eligible for scoring:
            </p>
            <ol className="list-decimal ml-5 text-[13.5px] space-y-2 mb-3">
              <li>
                <strong>Jolpica calendar gate.</strong> Each session must match a round in the official
                Jolpica/Ergast calendar for the requested year. Matching uses a closest-date approach
                with an 8-day window; sessions outside this window are dropped.
              </li>
              <li>
                <strong>Lap-data check (current season).</strong> For every completed race of the
                current season, the scoring system verifies that at least 10 drivers have a recorded
                lap-1 entry. A cancelled session that still appears in the calendar (e.g., the 2026
                Bahrain and Saudi Arabian rounds, called off for geopolitical reasons) has zero lap
                records and is therefore excluded. Historical seasons are deliberately not filtered:
                OpenF1 has genuine data gaps for races that did take place, and hiding them would be
                worse than showing them without a verdict.
              </li>
            </ol>
            <p className="text-[13.5px]">
              All API responses are cached at the infrastructure layer: session lists for 2 minutes,
              telemetry for 1 hour, and driver grids for 1 hour with a 24-hour stale-while-revalidate window.
            </p>
          </section>

          <section className="mb-7">
            <h2 className="text-[15px] font-bold mb-3">7. Limitations and Future Work</h2>
            <p className="text-[13.5px] mb-3">
              Several aspects of race excitement are not captured by the current scoring system:
            </p>
            <ul className="list-disc ml-5 text-[13.5px] space-y-1.5 mb-3">
              <li><strong>Championship context.</strong> A last-lap overtake between title contenders carries more significance than the same move between mid-field runners. The algorithm has no awareness of standings.</li>
              <li><strong>Close battles without overtakes.</strong> Wheel-to-wheel racing in the final laps that does not result in a position change goes undetected.</li>
              <li><strong>Grid-position signal quality.</strong> First-recorded position is used as a grid-position proxy. Drivers who start from the pit lane or are penalised before lap 1 may have an inaccurate starting reference, slightly over-reporting forward movement.</li>
              <li><strong>Strategy interpretation.</strong> The pit-strategy signal rewards high stop counts but does not model undercut/overcut sequences or tyre-compound divergence, which require additional telemetry not currently in scope.</li>
              <li><strong>Sprint sessions.</strong> The same algorithm is applied to sprint races, which are shorter and structurally different. No scoring adjustments are made for session length.</li>
            </ul>
            <p className="text-[13.5px]">
              Future iterations may incorporate a continuous-overtake count (if made available through
              the OpenF1 API) and a proximity signal to address the close-battle limitation. Raw
              time-within-one-second is not a viable form of that signal—under the 2026 regulations
              cars run in close formation by default, so proximity alone detects trains rather than
              battles; it must be paired with a subsequent position change to count.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold mb-3">References</h2>
            <ol className="list-decimal ml-5 text-[13px] space-y-1.5">
              <li>
                OpenF1 Project. <em>OpenF1 — Free and Open-Source F1 Data.</em>{
                " "}<span className="font-mono">openf1.org</span>, 2024.
              </li>
              <li>
                Jolpica. <em>Jolpica-F1 API — Ergast Compatibility Layer.</em>{
                " "}<span className="font-mono">api.jolpi.ca/ergast</span>, 2024.
              </li>
              <li>
                Fédération Internationale de l&apos;Automobile. <em>2025 Formula One Sporting Regulations.</em>{
                " "}FIA, Geneva, 2025.
              </li>
            </ol>
          </section>

          <div className="mt-10 pt-4 border-t border-[#ddd] text-[11px] text-[#999] flex justify-between">
            <span>© 2026 Vishal Soni · shalliwatchtherace.com</span>
            <span>Technical Report v1.1 · revised July 2026</span>
          </div>

        </article>
      </div>
    </>
  );
}
