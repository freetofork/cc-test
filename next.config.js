/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard.html',
      },
    ];
  },
};

module.exports = nextConfig;
