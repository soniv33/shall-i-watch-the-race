import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "How It Works — Shall I Watch The Race?",
  description: "How the Worth Watching vs Highlights Only verdict is decided. No black boxes.",
};

export default function AboutPage() {
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
            How it works
          </h1>
          <p className="text-muted text-sm">No opinions. No spoilers. Just data.</p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">The verdicts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
              <span className="text-lg font-display font-black text-race">Worth Watching</span>
              <p className="text-sm text-foreground/60">
                Enough happened that watching in full is worth your time. A highlights package
                would leave out moments that matter.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
              <span className="text-lg font-display font-black text-highlights">Highlights Only</span>
              <p className="text-sm text-foreground/60">
                The key moments are captured in a short highlights reel. Watching the full race
                won't add much.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">What we measure</h2>
          <div className="flex flex-col gap-3">
            {[
              {
                title: "Race incidents",
                body: "Safety cars and red flags disrupt running order and create unpredictability. More interruptions generally mean more action.",
              },
              {
                title: "On-track action",
                body: "Drivers who gain 5+ places on track. Retirements aren't counted — only genuine forward movement signals a race worth watching.",
              },
              {
                title: "Weather",
                body: "Sustained rain changes everything. A brief shower scores less than a race run in genuinely wet conditions — what matters is how long the track stayed wet.",
              },
              {
                title: "Strategy",
                body: "Genuinely varied pit stop strategies — where some drivers run significantly more stops than others — create diverging paths and keep more storylines alive for longer.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">{title}</span>
                <p className="text-sm text-foreground/50">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">What we don't use</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-foreground/60 leading-relaxed">
              We never use finishing positions, driver names, lap times, or results of any kind.
              Everything comes from race control data and anonymised telemetry via{
              " "}
              <a
                href="https://openf1.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
              >
                OpenF1
              </a>
              . The verdict is based entirely on what happened on track — not who it happened to.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">How it's scored</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-foreground/60 leading-relaxed">
              Each signal contributes points up to a defined cap: race incidents up to 25,
              weather up to 15, on-track action up to 40, and strategy up to 10.
              The raw score is normalised against a benchmark of 65 points — calibrated so
              that a genuinely exciting race (safety car, lead battle, solid overtaking)
              scores 6–8 out of 10.
              A score of 6.0 or above earns a <span className="text-race">Worth Watching</span> verdict;
              below that it's <span className="text-highlights">Highlights Only</span>.
              Strategy points are only awarded when a race features genuinely varied pit stop
              counts — not just because the field averaged a second stop.
            </p>
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <p className="text-sm text-foreground/60">
              Want the full detail — point values, normalisation formula, personalisation logic, and known limitations?
            </p>
            <Link
              href="/algorithm"
              className="self-start text-sm font-medium text-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Read the full technical specification →
            </Link>
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
