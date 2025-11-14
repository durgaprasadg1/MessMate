import type { NextConfig } from "next";

const NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};


export default NextConfig;
