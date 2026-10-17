import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // The bank is closed; every old address lands on the notice page
        // rather than a 404. `+` and not `*`, so the notice page itself — which
        // is /qb — is not caught by its own rule and redirected to itself.
        source: "/qb/:path+",
        destination: "/qb",
        permanent: true,
      },
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
