import {
  Injectable,
  inject,
  signal,
  computed,
  type Signal,
  type WritableSignal,
  DestroyRef,
} from '@angular/core';
import { Observable, Subject, BehaviorSubject, from, shareReplay, switchMap } from 'rxjs';
import {
  FlagsClient,
  type FlagConfiguration,
  type EvaluationContext,
  type JsonValue,
  type ResolutionDetails,
  type FlagSnapshot,
  type ChangedFlags,
  type FlagsClientEvent,
} from '@kitbase/flags';
import { FLAGS_CONFIG, type FlagSignalOptions, type FlagSignalResult } from './types.js';

/**
 * Angular service for evaluating Kitbase feature flags.
 *
 * Provides reactive flag evaluation through Angular Signals and RxJS Observables,
 * with automatic re-evaluation when the backend configuration changes.
 *
 * @example
 * ```typescript
 * import { Component, inject } from '@angular/core';
 * import { FlagsService } from '@kitbase/flags-angular';
 *
 * @Component({
 *   selector: 'app-feature',
 *   template: `
 *     @if (darkMode().isLoading) {
 *       <p>Loading...</p>
 *     } @else {
 *       <p>Dark mode is {{ darkMode().value ? 'enabled' : 'disabled' }}</p>
 *     }
 *   `,
 * })
 * export class FeatureComponent {
 *   private flags = inject(FlagsService);
 *
 *   // Signal-based flag (reactive, re-emits on config changes)
 *   darkMode = this.flags.getBooleanFlag('dark-mode', false);
 *
 *   // Or with context
 *   premiumFeature = this.flags.getBooleanFlag('premium-feature', false, {
 *     context: { targetingKey: 'user-123', plan: 'premium' }
 *   });
 * }
 * ```
 */
@Injectable()
export class FlagsService {
  private readonly config = inject(FLAGS_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly client: FlagsClient;

  private readonly configChange$ = new Subject<FlagConfiguration>();
  private readonly flagChange$ = new Subject<ChangedFlags>();
  private readonly ready$ = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits when configuration changes from the backend.
   * Useful for manual re-evaluation or triggering side effects.
   */
  readonly configurationChanged$: Observable<FlagConfiguration> = this.configChange$.asObservable();

  /**
   * Observable that emits when specific flags change.
   * Emits a map of flag keys to their new values.
   */
  readonly flagsChanged$: Observable<ChangedFlags> = this.flagChange$.asObservable();

  /**
   * Observable that emits true when the client is ready for flag evaluation.
   */
  readonly isReady$: Observable<boolean> = this.ready$.asObservable();

  constructor() {
    this.client = new FlagsClient(this.config);

    // Subscribe to client events
    const unsubscribeEvents = this.client.on((event: FlagsClientEvent) => {
      if (event.type === 'ready') {
        this.ready$.next(true);
        this.configChange$.next(event.config);
      } else if (event.type === 'configurationChanged') {
        this.configChange$.next(event.config);
      }
    });

    // Subscribe to flag changes
    const { unsubscribe: unsubscribeFlagChange } = this.client.onFlagChange((changedFlags: ChangedFlags) => {
      this.flagChange$.next(changedFlags);
    });

    // If client is already ready (e.g., remote evaluation mode)
    if (this.client.isReady()) {
      this.ready$.next(true);
    }

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      unsubscribeEvents();
      unsubscribeFlagChange();
      this.client.close();
      this.configChange$.complete();
      this.flagChange$.complete();
      this.ready$.complete();
    });
  }

  // ==================== Signal-based Methods ====================

  /**
   * Get a boolean flag value as a reactive Signal.
   * The signal automatically updates when the backend configuration changes.
   *
   * @param key - The flag key
   * @param options - Optional evaluation context
   * @returns A computed signal containing the flag result
   *
   * @example
   * ```typescript
   * const darkMode = this.flags.getBooleanFlag('dark-mode');
   *
   * // In template:
   * // {{ darkMode().value }}
   * // {{ darkMode().isLoading }}
   * ```
   */
  getBooleanFlag(
    key: string,
    options?: FlagSignalOptions,
  ): Signal<FlagSignalResult<boolean>> {
    return this.createFlagSignal(
      key,
      (k, ctx) => this.client.getBooleanValue(k, ctx),
      options,
    );
  }

  /**
   * Get a string flag value as a reactive Signal.
   * The signal automatically updates when the backend configuration changes.
   *
   * @param key - The flag key
   * @param options - Optional evaluation context
   * @returns A computed signal containing the flag result
   */
  getStringFlag(
    key: string,
    options?: FlagSignalOptions,
  ): Signal<FlagSignalResult<string>> {
    return this.createFlagSignal(
      key,
      (k, ctx) => this.client.getStringValue(k, ctx),
      options,
    );
  }

  /**
   * Get a number flag value as a reactive Signal.
   * The signal automatically updates when the backend configuration changes.
   *
   * @param key - The flag key
   * @param options - Optional evaluation context
   * @returns A computed signal containing the flag result
   */
  getNumberFlag(
    key: string,
    options?: FlagSignalOptions,
  ): Signal<FlagSignalResult<number>> {
    return this.createFlagSignal(
      key,
      (k, ctx) => this.client.getNumberValue(k, ctx),
      options,
    );
  }

  /**
   * Get a JSON flag value as a reactive Signal.
   * The signal automatically updates when the backend configuration changes.
   *
   * @param key - The flag key
   * @param options - Optional evaluation context
   * @returns A computed signal containing the flag result
   */
  getJsonFlag<T extends JsonValue = JsonValue>(
    key: string,
    options?: FlagSignalOptions,
  ): Signal<FlagSignalResult<T>> {
    return this.createFlagSignal(
      key,
      (k, ctx) => this.client.getJsonValue(k, ctx) as Promise<T>,
      options,
    );
  }

  // ==================== Observable-based Methods ====================

  /**
   * Get a boolean flag value as an Observable.
   * Emits the current value and re-emits when the flag value changes.
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns An Observable that emits the flag value
   */
  getBooleanFlag$(
    key: string,
    context?: EvaluationContext,
  ): Observable<boolean> {
    return this.createFlagObservable(key, () =>
      this.client.getBooleanValue(key, context),
    );
  }

  /**
   * Get a string flag value as an Observable.
   * Emits the current value and re-emits when the flag value changes.
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns An Observable that emits the flag value
   */
  getStringFlag$(
    key: string,
    context?: EvaluationContext,
  ): Observable<string> {
    return this.createFlagObservable(key, () =>
      this.client.getStringValue(key, context),
    );
  }

  /**
   * Get a number flag value as an Observable.
   * Emits the current value and re-emits when the flag value changes.
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns An Observable that emits the flag value
   */
  getNumberFlag$(
    key: string,
    context?: EvaluationContext,
  ): Observable<number> {
    return this.createFlagObservable(key, () =>
      this.client.getNumberValue(key, context),
    );
  }

  /**
   * Get a JSON flag value as an Observable.
   * Emits the current value and re-emits when the flag value changes.
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns An Observable that emits the flag value
   */
  getJsonFlag$<T extends JsonValue = JsonValue>(
    key: string,
    context?: EvaluationContext,
  ): Observable<T> {
    return this.createFlagObservable(key, () =>
      this.client.getJsonValue(key, context) as Promise<T>,
    );
  }

  // ==================== One-shot Promise Methods ====================

  /**
   * Get a boolean flag value (one-shot, no re-emission on config changes).
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns Promise resolving to the flag value
   */
  async getBooleanValue(
    key: string,
    context?: EvaluationContext,
  ): Promise<boolean> {
    return this.client.getBooleanValue(key, context);
  }

  /**
   * Get a string flag value (one-shot, no re-emission on config changes).
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns Promise resolving to the flag value
   */
  async getStringValue(
    key: string,
    context?: EvaluationContext,
  ): Promise<string> {
    return this.client.getStringValue(key, context);
  }

  /**
   * Get a number flag value (one-shot, no re-emission on config changes).
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns Promise resolving to the flag value
   */
  async getNumberValue(
    key: string,
    context?: EvaluationContext,
  ): Promise<number> {
    return this.client.getNumberValue(key, context);
  }

  /**
   * Get a JSON flag value (one-shot, no re-emission on config changes).
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns Promise resolving to the flag value
   */
  async getJsonValue<T extends JsonValue = JsonValue>(
    key: string,
    context?: EvaluationContext,
  ): Promise<T> {
    return this.client.getJsonValue(key, context) as Promise<T>;
  }

  /**
   * Get full resolution details for a boolean flag.
   *
   * @param key - The flag key
   * @param context - Optional evaluation context
   * @returns Promise resolving to the resolution details
   */
  async getBooleanDetails(
    key: string,
    context?: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    return this.client.getBooleanDetails(key, context);
  }

  /**
   * Get a snapshot of all evaluated flags.
   *
   * @param context - Optional evaluation context
   * @returns Promise resolving to the flag snapshot
   */
  async getSnapshot(context?: EvaluationContext): Promise<FlagSnapshot> {
    return this.client.getSnapshot({ context });
  }

  /**
   * Check if the client is ready for flag evaluation.
   */
  isReady(): boolean {
    return this.client.isReady();
  }

  /**
   * Wait for the client to be ready.
   * Useful for ensuring initialization before rendering.
   */
  async waitUntilReady(): Promise<void> {
    return this.client.waitUntilReady();
  }

  /**
   * Manually refresh the configuration (local evaluation mode only).
   */
  async refresh(): Promise<void> {
    return this.client.refresh();
  }

  /**
   * Get the underlying FlagsClient instance for advanced usage.
   */
  getClient(): FlagsClient {
    return this.client;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Create a reactive signal for a flag value.
   * The signal updates when the specific flag changes.
   */
  private createFlagSignal<T>(
    key: string,
    fetcher: (key: string, context?: EvaluationContext) => Promise<T>,
    options?: FlagSignalOptions,
  ): Signal<FlagSignalResult<T>> {
    const valueSignal: WritableSignal<T | undefined> = signal(undefined);
    const isLoadingSignal: WritableSignal<boolean> = signal(true);
    const errorSignal: WritableSignal<Error | null> = signal(null);

    const fetchFlag = async () => {
      isLoadingSignal.set(true);
      errorSignal.set(null);
      try {
        const value = await fetcher(key, options?.context);
        valueSignal.set(value);
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
      } finally {
        isLoadingSignal.set(false);
      }
    };

    // Initial fetch
    fetchFlag();

    // Subscribe to flag changes - only refetch when this specific flag changes
    const subscription = this.flagChange$.subscribe((changedFlags) => {
      if (key in changedFlags) {
        fetchFlag();
      }
    });

    // Cleanup subscription on destroy
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

    // Return computed signal combining all state
    return computed(() => ({
      value: valueSignal(),
      isLoading: isLoadingSignal(),
      error: errorSignal(),
    }));
  }

  /**
   * Create an Observable for a flag value.
   * The Observable re-emits when the specific flag changes.
   */
  private createFlagObservable<T>(key: string, fetcher: () => Promise<T>): Observable<T> {
    // Create a BehaviorSubject that triggers on flag changes
    const trigger$ = new BehaviorSubject<void>(undefined);

    // Subscribe to flag changes - only trigger when this specific flag changes
    const subscription = this.flagChange$.subscribe((changedFlags) => {
      if (key in changedFlags) {
        trigger$.next(undefined);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      trigger$.complete();
    });

    // Return Observable that fetches on each trigger
    return trigger$.pipe(
      switchMap(() => from(fetcher())),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
