import type { NextConfig } from "next";

const devOrigins = (process.env.ALLOWED_DEV_ORIGINS || 'http://31.97.59.115:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
