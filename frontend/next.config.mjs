/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://lakeclean-api.onrender.com/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "https://lakeclean-api.onrender.com/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
