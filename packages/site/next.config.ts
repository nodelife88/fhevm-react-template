import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /fhevm-sdk\/node_modules/,
      use: "null-loader",
    })
    return config
  },

  headers() {
    return Promise.resolve([
      {
        source: "/",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ])
  },
}

export default nextConfig
