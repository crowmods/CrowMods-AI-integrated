export default function manifest() {
  return {
    name: "CrowMods AI Admin",
    short_name: "CrowMods",
    description: "CrowMods AI admin panel — uploads, approvals and publishing",
    start_url: "/admin/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };
}
