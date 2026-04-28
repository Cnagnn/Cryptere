import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['resources/js/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['resources/js/lib/lab-simulations.ts'],
            thresholds: { lines: 85, branches: 80 },
        },
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, 'resources/js') },
    },
});
