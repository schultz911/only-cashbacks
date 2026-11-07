import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  return {
    base: '/',
    experimental: {
      renderBuiltUrl(filename: string) {
        const cdnPrefix = process.env.VITE_CDN_URL || process.env.CDN_URL;
        if (cdnPrefix && mode === 'production' && !filename.endsWith('.js') && !filename.endsWith('.css')) {
          const base = cdnPrefix.endsWith('/') ? cdnPrefix : cdnPrefix + '/';
          return base + filename;
        }
        return '/' + filename;
      }
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.ico'],
        manifest: {
          name: 'OnlyCashbacks',
          short_name: 'OnlyCashbacks',
          description: 'Maximize your rewards with AI-driven card recommendations',
          theme_color: '#ffffff',
          background_color: '#F5F5F7',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: ['**/vendor-recharts*.js'],
          navigateFallbackDenylist: [/^\/(?:oauth|authorize|token|register|mcp|sse|health|\.well-known|api|messages|login|__)(?:\/|\?|$)/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && /^\/assets\/vendor-recharts[^/]*\.js$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'onlycashbacks-lazy-scripts-v2',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: ({ request, url }) => {
                const protectedPath = /^\/(?:oauth|authorize|token|register|mcp|sse|health|\.well-known|api|messages|login|__)(?:\/|$)/.test(url.pathname);
                const localStatic = url.origin === self.location.origin && !protectedPath;
                const googleFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
                return (localStatic && (request.destination === 'worker' || request.destination === 'font')) || googleFonts;
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'onlycashbacks-static-v2',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: ({ url }) => url.href.startsWith('https://open.er-api.com/v6/latest'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'onlycashbacks-api-v2',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 24 * 60 * 60 // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-recharts';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'mcp-server/tests/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
