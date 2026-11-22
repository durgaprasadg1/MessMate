import type { NextConfig } from "next";

function normalizeOriginHost(value?: string) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).hostname;
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");
  }
}

const configuredAllowedOrigins = [
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.NEXTAUTH_URL,
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? []),
]
  .map(normalizeOriginHost)
  .filter((value): value is string => Boolean(value));

const allowedOrigins = Array.from(
  new Set(["localhost", "127.0.0.1", ...configuredAllowedOrigins]),
);

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy. Allow-list covers exactly what the app loads today:
 * Bootstrap + Font Awesome (jsDelivr / cdnjs), Razorpay Checkout, Cloudinary
 * images, Google Fonts via next/font (self-hosted at build time) and Vercel
 * speed insights. Next.js needs inline scripts/styles, so 'unsafe-inline' is
 * kept for them; 'unsafe-eval' is only added in development (React refresh).
 * Test it in staging (browser console shows CSP violations) before production.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://cdn.jsdelivr.net https://checkout.razorpay.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://via.placeholder.com https://*.razorpay.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self' data: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  `connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com https://vitals.vercel-insights.com https://nominatim.openstreetmap.org${isProd ? "" : " ws: wss:"}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: csp },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  compiler: {
    // keep console.error, drop debug logging from the production bundle
    removeConsole: isProd ? { exclude: ["error"] } : false,
  },

  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dwgf6yo6e/image/upload/**",
      },
    ],
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
