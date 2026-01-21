import { defineConfig } from 'tsup';

export default defineConfig([
  // Full SDK (with offline queue support)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    splitting: false,
  },
  // Lite SDK (without offline queue - smaller bundle, IIFE for script tags)
  {
    entry: { lite: 'src/lite.ts' },
    platform: 'browser',
    format: ['iife'],
    dts: false,
    sourcemap: false,
    clean: false, // Don't clean - would remove full SDK output
    target: 'es2022',
    splitting: false,
    globalName: 'Kitbase',
    minify: true,
  },
]);
