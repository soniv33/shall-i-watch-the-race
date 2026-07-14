import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Shall I Watch The Race?",
  description: "Should you watch the full race or just the highlights? Spoiler-free verdict for every F1 race.",
  openGraph: {
    title: "Shall I Watch The Race?",
    description: "Spoiler-free Watch or Highlights verdict for every F1 race.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shall I Watch The Race?",
    description: "Spoiler-free Watch or Highlights verdict for every F1 race.",
  },
};

// Cloudflare Web Analytics beacon token (public — it ships in the HTML).
// Overridable via NEXT_PUBLIC_CF_BEACON_TOKEN in Vercel.
const CF_BEACON_TOKEN =
  process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "a60e5059afff4353ba9181de1efcda34";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      {/* Prevent flash of wrong theme — runs before React hydrates */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('siwr-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();` }} />
      <body className={`${inter.variable} ${barlow.variable} min-h-screen font-sans`}>
        {children}
        <Analytics />
        {CF_BEACON_TOKEN && (
          <script
            type="module"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
          />
        )}
      </body>
    </html>
  );
}
