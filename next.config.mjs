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
    domains: ['a.l3n.co', 'b.l3n.co', 'c.l3n.co', 'api.swarmada.wiki'],
  },
};

export default nextConfig;