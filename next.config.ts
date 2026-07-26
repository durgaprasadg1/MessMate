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
  new Set(["localhost", "127.0.0.1", ...configuredAllowedOrigins])
);

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,

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
};

export default nextConfig;