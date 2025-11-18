const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.turbo entirely
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
