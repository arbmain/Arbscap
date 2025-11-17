const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // disables Turbopack
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
