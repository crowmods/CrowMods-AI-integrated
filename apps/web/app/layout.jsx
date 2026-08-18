export const metadata = {
  title: "CrowMods AI",
  description: "Unified CrowMods AI platform",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  themeColor: "#0b0f17",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CrowMods" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CrowMods" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
