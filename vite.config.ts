import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const enableSourceMap = process.env.VITE_BUILD_SOURCEMAP === 'true';
const enableReactCompiler =
    process.env.NODE_ENV === 'production' &&
    process.env.VITE_REACT_COMPILER !== 'false';

export default defineConfig({
    build: {
        sourcemap: enableSourceMap ? 'hidden' : false,
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
