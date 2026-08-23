import type { Metadata } from "next";
import { Inter, JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import SkipLink from "@/components/ui/SkipLink";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-fallback",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adrian Azucena — Backend Engineering Console",
  description:
    "A portfolio that functions as an engineering tool: drive a mock developer console, watch a queue fail and retry into a DLQ, run a sequential-vs-parallel benchmark, and click through a live architecture diagram.",
};

// Runs before hydration so the persisted theme (site/lib/theme.ts) applies with no flash of the
// wrong theme. Mirrors getTheme()'s localStorage read + default-to-dark fallback; kept inline
// (not imported) because it must execute synchronously in <head>, before React hydrates.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("adrian-portfolio-theme");
    var theme = stored === "light" ? "light" : "dark";
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-text-primary font-sans antialiased" suppressHydrationWarning>
        <SkipLink targetId="main-content" />
        {children}
        <p className="pointer-events-none fixed bottom-1 right-2 z-10 select-none font-mono text-[10px] text-text-muted opacity-50">
          UI built with Claude
        </p>
      </body>
    </html>
  );
}
