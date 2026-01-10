import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'events/index': 'src/events/index.ts',
    'changelogs/index': 'src/changelogs/index.ts',
    'flags/index': 'src/flags/index.ts',
    'flags/server/index': 'src/flags/server/index.ts',
    'flags/web/index': 'src/flags/web/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2022',
  // Mark OpenFeature SDKs as external (peer dependencies)
  external: ['@openfeature/server-sdk', '@openfeature/web-sdk'],
});
