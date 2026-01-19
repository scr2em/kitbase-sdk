import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  external: [
    '@angular/core',
    '@angular/common',
    '@angular/router',
    'rxjs',
    '@kitbase/analytics',
  ],
});
