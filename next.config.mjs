/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/live-chat", destination: "/contact-center", permanent: true },
      { source: "/comments", destination: "/contact-center", permanent: true },
      { source: "/comments-fb", destination: "/contact-center", permanent: true },
    ];
  },
};

export default nextConfig;
