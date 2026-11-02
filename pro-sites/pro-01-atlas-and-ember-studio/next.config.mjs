/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // fully static build in ./out
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
