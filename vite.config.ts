import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const enableSourceMap = process.env.VITE_BUILD_SOURCEMAP === 'true';
const enableReactCompiler =
    process.env.NODE_ENV === 'production' &&
    process.env.VITE_REACT_COMPILER === 'true';

export default defineConfig({
    build: {
        sourcemap: enableSourceMap ? 'hidden' : false,
        chunkSizeWarningLimit: 600, // Algorithm implementations (AES/DES/SHA-256/RSA) are intentionally bundled; gzip: ~172KB for labs page
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Vendor chunks for large dependencies
                    if (id.includes('node_modules')) {
                        if (id.includes('@inertiajs/')) {
                            return 'inertia-vendor';
                        }
                        if (id.includes('recharts')) {
                            return 'charts-vendor';
                        }
                        if (id.includes('@tiptap/')) {
                            return 'editor-vendor';
                        }
                        if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
                            return 'ui-vendor';
                        }
                    }
                },
            },
        },
    },
    server: {
        host: '127.0.0.1',
        hmr: {
            host: '127.0.0.1',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: enableReactCompiler
                ? {
                      plugins: ['babel-plugin-react-compiler'],
                  }
                : undefined,
        }),
        tailwindcss(),
        // wayfinder({
        //     formVariants: true,
        // }),
    ],
});
