/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite compilar (npm run build) mientras corre "next dev": NEXT_DIST_DIR=.next-build npm run build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      { source: "/voluntarios", destination: "/equipo", permanent: true },
      { source: "/becas", destination: "/oportunidades", permanent: true },
    ];
  },
};

export default nextConfig;
