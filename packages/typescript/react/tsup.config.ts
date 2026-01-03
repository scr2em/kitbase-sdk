import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    flags: 'src/flags/index.ts',
    events: 'src/events/index.ts',
    changelogs: 'src/changelogs/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2022',
  external: ['react', '@kitbase/sdk'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
