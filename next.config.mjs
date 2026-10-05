/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/voluntarios", destination: "/equipo", permanent: true },
      { source: "/becas", destination: "/oportunidades", permanent: true },
    ];
  },
};

export default nextConfig;
