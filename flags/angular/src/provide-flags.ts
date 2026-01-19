import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { FlagsConfig } from '@kitbase/flags';
import { FLAGS_CONFIG } from './types.js';
import { FlagsService } from './flags.service.js';

/**
 * Provides the Kitbase Feature Flags service for Angular standalone applications.
 *
 * @param config - Configuration options for the FlagsClient
 * @returns EnvironmentProviders to add to your application
 *
 * @example
 * ```typescript
 * // In your app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideFlags } from '@kitbase/flags-angular';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFlags({
 *       sdkKey: 'YOUR_SDK_KEY',
 *       enableLocalEvaluation: true,
 *       environmentRefreshIntervalSeconds: 60,
 *     }),
 *   ],
 * };
 * ```
 *
 * @example
 * ```typescript
 * // In a component
 * import { Component, inject } from '@angular/core';
 * import { FlagsService } from '@kitbase/flags-angular';
 *
 * @Component({
 *   selector: 'app-feature',
 *   template: `
 *     @if (darkMode().isLoading) {
 *       <p>Loading...</p>
 *     } @else {
 *       <p>Dark mode: {{ darkMode().value }}</p>
 *     }
 *   `,
 * })
 * export class FeatureComponent {
 *   private flags = inject(FlagsService);
 *   darkMode = this.flags.getBooleanFlag('dark-mode', false);
 * }
 * ```
 */
export function provideFlags(config: FlagsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FLAGS_CONFIG,
      useValue: config,
    },
    FlagsService,
  ]);
}
