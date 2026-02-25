/**
 * React integration for Kitbase Analytics SDK
 *
 * Provides React hooks and context provider for easy integration
 * with React applications.
 *
 * @example
 * ```tsx
 * import { KitbaseAnalyticsProvider, useKitbaseAnalytics, useTrack } from '@kitbase/analytics-react';
 *
 * function App() {
 *   return (
 *     <KitbaseAnalyticsProvider config={{ token: 'your-api-key' }}>
 *       <MyComponent />
 *     </KitbaseAnalyticsProvider>
 *   );
 * }
 *
 * function MyComponent() {
 *   const track = useTrack();
 *
 *   return (
 *     <button onClick={() => track({ channel: 'ui', event: 'Button Clicked' })}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import {
  KitbaseAnalytics,
  type KitbaseConfig,
  type TrackOptions,
  type TrackResponse,
  type PageViewOptions,
  type RevenueOptions,
  type IdentifyOptions,
  type Tags,
} from '@kitbase/analytics';

// Re-export everything from core
export * from '@kitbase/analytics';

// ============================================================
// Context
// ============================================================

const KitbaseAnalyticsContext = createContext<KitbaseAnalytics | null>(null);

/**
 * Props for the KitbaseAnalyticsProvider component
 */
export interface KitbaseAnalyticsProviderProps {
  /**
   * KitbaseAnalytics configuration options
   */
  config: KitbaseConfig;

  /**
   * React children to render
   */
  children: ReactNode;
}

/**
 * Provider component that initializes KitbaseAnalytics and makes it available
 * to all child components via React context.
 *
 * @example
 * ```tsx
 * import { KitbaseAnalyticsProvider } from '@kitbase/analytics-react';
 *
 * function App() {
 *   return (
 *     <KitbaseAnalyticsProvider
 *       config={{
 *         token: 'your-api-key',
 *         debug: true,
 *         analytics: { autoTrackPageViews: true },
 *       }}
 *     >
 *       <YourApp />
 *     </KitbaseAnalyticsProvider>
 *   );
 * }
 * ```
 */
export function KitbaseAnalyticsProvider({ config, children }: KitbaseAnalyticsProviderProps) {
  const kitbaseRef = useRef<KitbaseAnalytics | null>(null);

  // Initialize KitbaseAnalytics instance once
  if (!kitbaseRef.current) {
    kitbaseRef.current = new KitbaseAnalytics(config);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      kitbaseRef.current?.shutdown();
    };
  }, []);

  return (
    <KitbaseAnalyticsContext.Provider value={kitbaseRef.current}>
      {children}
    </KitbaseAnalyticsContext.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to access the KitbaseAnalytics instance directly.
 *
 * @returns The KitbaseAnalytics instance
 * @throws Error if used outside of KitbaseAnalyticsProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const kitbase = useKitbaseAnalytics();
 *
 *   useEffect(() => {
 *     kitbase.register({ page: 'home' });
 *   }, [kitbase]);
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
export function useKitbaseAnalytics(): KitbaseAnalytics {
  const context = useContext(KitbaseAnalyticsContext);

  if (!context) {
    throw new Error('useKitbaseAnalytics must be used within a KitbaseAnalyticsProvider');
  }

  return context;
}

/**
 * Hook to get a memoized track function.
 *
 * @returns A function to track events
 *
 * @example
 * ```tsx
 * function Button() {
 *   const track = useTrack();
 *
 *   const handleClick = () => {
 *     track({
 *       channel: 'ui',
 *       event: 'Button Clicked',
 *       tags: { button_id: 'cta' },
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useTrack() {
  const kitbase = useKitbaseAnalytics();

  return useCallback(
    (options: TrackOptions): Promise<TrackResponse | void> => {
      return kitbase.track(options);
    },
    [kitbase]
  );
}

/**
 * Hook to get a memoized identify function.
 *
 * @returns A function to identify users
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const identify = useIdentify();
 *
 *   const handleLogin = async (userId: string, email: string) => {
 *     await identify({
 *       userId,
 *       traits: { email },
 *     });
 *   };
 *
 *   return <form>...</form>;
 * }
 * ```
 */
export function useIdentify() {
  const kitbase = useKitbaseAnalytics();

  return useCallback(
    (options: IdentifyOptions): Promise<void> => {
      return kitbase.identify(options);
    },
    [kitbase]
  );
}

/**
 * Hook to get a memoized page view tracking function.
 *
 * @returns A function to track page views
 *
 * @example
 * ```tsx
 * function Page() {
 *   const trackPageView = usePageView();
 *
 *   useEffect(() => {
 *     trackPageView({ path: '/dashboard', title: 'Dashboard' });
 *   }, [trackPageView]);
 *
 *   return <div>Dashboard</div>;
 * }
 * ```
 */
export function usePageView() {
  const kitbase = useKitbaseAnalytics();

  return useCallback(
    (options?: PageViewOptions): Promise<TrackResponse | void> => {
      return kitbase.trackPageView(options);
    },
    [kitbase]
  );
}

/**
 * Hook to automatically track page views when the component mounts
 * or when dependencies change.
 *
 * @param options - Page view options (optional)
 * @param deps - Dependencies that trigger a new page view when changed
 *
 * @example
 * ```tsx
 * function ProductPage({ productId }: { productId: string }) {
 *   // Track page view on mount and when productId changes
 *   useAutoPageView(
 *     { tags: { product_id: productId } },
 *     [productId]
 *   );
 *
 *   return <div>Product {productId}</div>;
 * }
 * ```
 */
export function useAutoPageView(
  options?: PageViewOptions,
  deps: React.DependencyList = []
) {
  const kitbase = useKitbaseAnalytics();

  useEffect(() => {
    kitbase.trackPageView(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to get a memoized revenue tracking function.
 *
 * @returns A function to track revenue events
 *
 * @example
 * ```tsx
 * function Checkout() {
 *   const trackRevenue = useRevenue();
 *
 *   const handlePurchase = async (amount: number) => {
 *     await trackRevenue({
 *       amount,
 *       currency: 'USD',
 *       tags: { product: 'premium' },
 *     });
 *   };
 *
 *   return <button onClick={() => handlePurchase(1999)}>Buy</button>;
 * }
 * ```
 */
export function useRevenue() {
  const kitbase = useKitbaseAnalytics();

  return useCallback(
    (options: RevenueOptions): Promise<TrackResponse | void> => {
      return kitbase.trackRevenue(options);
    },
    [kitbase]
  );
}

/**
 * Hook to track event duration.
 *
 * @param eventName - The name of the event to time
 * @returns Object with start and stop functions
 *
 * @example
 * ```tsx
 * function VideoPlayer() {
 *   const { start, stop } = useTimeEvent('Video Watched');
 *   const track = useTrack();
 *
 *   const handlePlay = () => start();
 *   const handleEnd = async () => {
 *     await track({
 *       channel: 'engagement',
 *       event: 'Video Watched',
 *       tags: { video_id: '123' },
 *     });
 *     // $duration is automatically included
 *   };
 *
 *   return (
 *     <video onPlay={handlePlay} onEnded={handleEnd}>
 *       ...
 *     </video>
 *   );
 * }
 * ```
 */
export function useTimeEvent(eventName: string) {
  const kitbase = useKitbaseAnalytics();

  return useMemo(
    () => ({
      start: () => kitbase.timeEvent(eventName),
      stop: () => kitbase.cancelTimeEvent(eventName),
      getDuration: () => kitbase.getEventDuration(eventName),
    }),
    [kitbase, eventName]
  );
}

/**
 * Hook to register super properties.
 *
 * @param properties - Properties to register
 * @param deps - Dependencies that trigger re-registration when changed
 *
 * @example
 * ```tsx
 * function App({ user }: { user: User }) {
 *   // Register user properties that will be included in all events
 *   useSuperProperties(
 *     { user_type: user.type, plan: user.plan },
 *     [user.type, user.plan]
 *   );
 *
 *   return <MainContent />;
 * }
 * ```
 */
export function useSuperProperties(
  properties: Tags,
  deps: React.DependencyList = []
) {
  const kitbase = useKitbaseAnalytics();

  useEffect(() => {
    kitbase.register(properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to get the current user ID (set via identify).
 *
 * @returns The user ID or null
 *
 * @example
 * ```tsx
 * function UserBadge() {
 *   const userId = useUserId();
 *   if (!userId) return null;
 *   return <div>Logged in as: {userId}</div>;
 * }
 * ```
 */
export function useUserId(): string | null {
  const kitbase = useKitbaseAnalytics();
  return kitbase.getUserId();
}

/**
 * Hook to reset the user identity.
 *
 * @returns A function to reset the user
 *
 * @example
 * ```tsx
 * function LogoutButton() {
 *   const reset = useReset();
 *
 *   const handleLogout = () => {
 *     // Clear server session...
 *     reset();
 *   };
 *
 *   return <button onClick={handleLogout}>Logout</button>;
 * }
 * ```
 */
export function useReset() {
  const kitbase = useKitbaseAnalytics();

  return useCallback(() => {
    kitbase.reset();
  }, [kitbase]);
}

