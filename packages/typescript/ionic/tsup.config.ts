import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry point with shebang
  {
    entry: { 'cli': 'src/cli.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    target: 'es2022',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Library exports
  {
    entry: { 'index': 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    target: 'es2022',
  },
]);

