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
  // Lite SDK (without offline queue - smaller bundle)
  {
    entry: { lite: 'src/lite.ts' },
    format: ['cjs', 'esm', 'iife'],
    dts: true,
    sourcemap: false,
    clean: false, // Don't clean - would remove full SDK output
    target: 'es2022',
    splitting: false,
    globalName: 'KitbaseLite',
    minify: true,
    esbuildOptions(options) {
      // For IIFE build, ensure the global is accessible
      options.footer = {
        js: 'if(typeof window!=="undefined"){window.KitbaseLite=KitbaseLite;}',
      };
    },
  },
]);
