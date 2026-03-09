import { useMemo, useEffect, useRef, type ReactNode } from 'react';
import { Messaging, type MessagingConfig } from '@kitbase/messaging';
import { MessagingContext } from './context.js';

export interface MessagingProviderProps {
  /** Messaging SDK configuration */
  config: MessagingConfig;
  children: ReactNode;
}

/**
 * Provider for in-app messaging.
 *
 * By default, messages are fetched and rendered automatically.
 * Pass `autoShow: false` in config to use data-only hooks instead.
 *
 * @example Auto-render (default)
 * ```tsx
 * <MessagingProvider config={{ sdkKey: 'your-key', userId: user.id }}>
 *   <App />
 * </MessagingProvider>
 * // Messages appear automatically — no extra code needed!
 * ```
 *
 * @example Data-only (custom rendering)
 * ```tsx
 * <MessagingProvider config={{ sdkKey: 'your-key', autoShow: false }}>
 *   <App />
 * </MessagingProvider>
 * // Then use useMessages() hook to render your own UI
 * ```
 */
export function MessagingProvider({ config, children }: MessagingProviderProps) {
  const configRef = useRef(config);
  configRef.current = config;

  const client = useMemo(
    () => new Messaging(config),
    // Recreate when sdkKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.sdkKey],
  );

  useEffect(() => {
    return () => {
      client.close();
    };
  }, [client]);

  return (
    <MessagingContext.Provider value={client}>
      {children}
    </MessagingContext.Provider>
  );
}
