import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in $HOME otherwise misleads
  // Turbopack's auto-detection (see build warning).
  turbopack: {
    root: __dirname,
  },
  // Let the dev server accept requests from devices on the LAN (e.g. testing
  // on a phone at http://192.168.1.8:3000). Without this, Next 16 blocks the
  // cross-origin dev runtime and the page never hydrates — interactive
  // controls (password reveal, checkboxes) stop responding. Dev-only.
  allowedDevOrigins: ['192.168.1.8'],
};

export default nextConfig;
