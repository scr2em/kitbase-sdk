import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'events/index': 'src/events/index.ts',
    'changelogs/index': 'src/changelogs/index.ts',
    // 'flags/index': 'src/flags/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2022',
});

