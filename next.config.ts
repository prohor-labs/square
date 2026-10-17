import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The bank used to be browsed as a tree of containers — /qb/chem,
   * /qb/du-ka/… — where a "container" was really a subject pool and the year
   * came from the URL. Those questions are all still here; they are now reached
   * through the metadata instead, so the old paths send people to the bank
   * rather than 404. /qb/subjects is the closest thing to what those pages were.
   */
  async redirects() {
    return [
      { source: "/qb/du-ka", destination: "/qb/university", permanent: true },
      { source: "/qb/ru", destination: "/qb/university", permanent: true },
      { source: "/qb/medicalqb", destination: "/qb/medical", permanent: true },
      { source: "/qb/chem", destination: "/qb/subjects", permanent: true },
      { source: "/qb/onushiloniqb", destination: "/qb/subjects", permanent: true },
      { source: "/qb/arc-qb", destination: "/qb/mixed", permanent: true },
      {
        source: "/qb/:container/:item/:subitem",
        destination: "/qb/mixed",
        permanent: true,
      },
      { source: "/qb/:container/:item", destination: "/qb/mixed", permanent: true },
      { source: "/qb/:container", destination: "/qb", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https:;",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "79.143.185.101",
    "*.cloudworkstations.dev",
  ],
  reactCompiler: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "@base-ui/react",
      "@phosphor-icons/react",
      "class-variance-authority",
      "clsx",
      "cmdk",
      "date-fns",
      "embla-carousel-react",
      "input-otp",
      "radix-ui",
      "react-day-picker",
      "react-resizable-panels",
      "recharts",
      "shadcn",
      "sonner",
      "tailwind-merge",
      "tw-animate-css",
      "vaul",
    ],
  },
};

export default nextConfig;
