// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/biblioteca',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        ssh2: false,
        'tunnel-ssh': false,
      }
    }
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })
    return config
  },
}

export default nextConfig
