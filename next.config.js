/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tanstack/react-table'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-switch',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-accordion',
      '@radix-ui/react-scroll-area',
      'date-fns',
      '@hello-pangea/dnd',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
}

module.exports = nextConfig
