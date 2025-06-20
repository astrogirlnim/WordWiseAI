/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization to force all pages to be server-rendered
  output: 'standalone',
  
  // Experimental configurations to prevent SSG
  experimental: {
    dynamicIO: false,
  },

  // Configure to disable static generation
  trailingSlash: false,
  
  // Disable static exports completely
  distDir: '.next',
};

export default nextConfig;
