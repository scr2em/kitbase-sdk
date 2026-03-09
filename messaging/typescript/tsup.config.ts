import { defineConfig } from 'tsup';

export default defineConfig([
  // NPM package (CJS + ESM with type declarations)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    splitting: false,
  },
  // CDN build (minified IIFE for <script> tags)
  {
    entry: { cdn: 'src/cdn.ts' },
    platform: 'browser',
    format: ['iife'],
    dts: false,
    sourcemap: false,
    clean: false,
    target: 'es2022',
    splitting: false,
    globalName: 'KitbaseMessaging',
    minify: true,
    outExtension: () => ({ js: '.js' }),
  },
]);
