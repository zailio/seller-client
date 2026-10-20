import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  reactStrictMode: true,

  // The seller panel lives at the root of this project: "/" -> "/seller"
  async rewrites() {
    return [{ source: '/', destination: '/seller' }];
  },

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
