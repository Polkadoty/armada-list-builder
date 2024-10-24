/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.l3n.co',
      },
      {
        protocol: 'https',
        hostname: 'api.swarmada.wiki',
      },
    ],
  },
};

export default nextConfig;