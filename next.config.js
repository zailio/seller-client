import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  reactStrictMode: true,

  // Subdomain → dashboard routing (seller / brand / distributor) lives in proxy.js.

  // Optional obfuscated production bundle:  npm run build:obfuscated
  webpack(config, { isServer, dev }) {
    if (!isServer && !dev && process.env.OBFUSCATE === '1') {
      const WebpackObfuscator = require('webpack-obfuscator');
      config.plugins.push(
        new WebpackObfuscator(
          {
            rotateStringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.2,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: true,
          },
          []
        )
      );
    }
    return config;
  },
};

export default nextConfig;
