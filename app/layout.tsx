import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppQueryProvider } from "@/lib/query-client";
import { AuthProvider } from "@/lib/auth-context";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ITM Task Tracking",
  description: "ITM Africa internal task tracking — staff",
  applicationName: "ITM Task Tracking",
  // PWA: the manifest itself is app/manifest.ts; this covers iOS home-screen
  // launches, which read Apple-specific meta tags instead of the manifest.
  appleWebApp: {
    capable: true,
    title: "ITM Tasks",
    statusBarStyle: "default",
  },
};

// Browser/OS chrome color (status bar, installed-app title bar). Matches
// --color-surface so it blends with the top bar in either theme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e2025" },
  ],
};

// Applies a persisted theme choice before first paint, so there's no
// light-flash before hydration. Reads the same localStorage key
// components/theme-toggle.tsx writes to. Left unset (system default) when
// no choice has been made — globals.css then falls back to
// prefers-color-scheme.
const themeInitScript = `(function(){try{
  var t = localStorage.getItem('itm-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* A raw <script> here trips React 19's "scripts aren't executed on
            client render" check even though this is server-rendered HTML —
            next/script's beforeInteractive strategy is the supported way to
            inject a script that must run before hydration/first paint. */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppQueryProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
