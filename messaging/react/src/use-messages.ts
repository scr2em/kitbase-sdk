import { useState, useEffect, useCallback, useRef } from 'react';
import type { InAppMessage, GetMessagesOptions } from '@kitbase/messaging';
import { useMessagingContext } from './context.js';
import type { UseMessagesOptions } from './types.js';

export interface UseMessagesResult {
  /** Active in-app messages */
  messages: InAppMessage[];
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Error from the most recent fetch */
  error: Error | null;
  /**
   * Mark a message as viewed. Removes it from the UI immediately
   * and records the view on the server.
   * Requires `identify()` to have been called on the messaging instance.
   */
  markViewed: (messageId: string) => Promise<void>;
  /** Manually re-fetch messages */
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch in-app messages (data-only, for custom rendering).
 *
 * Use this with `autoShow: false` on the provider to build your own
 * message UI. For automatic rendering, just use the default provider
 * config and skip this hook.
 *
 * @example
 * ```tsx
 * function MessageList() {
 *   const { messages, markViewed, isLoading } = useMessages({
 *     pollInterval: 60_000,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return messages.map((msg) => (
 *     <div key={msg.id}>
 *       <h3>{msg.title}</h3>
 *       <p>{msg.body}</p>
 *       {msg.actionButton && (
 *         <a href={msg.actionButton.url}>{msg.actionButton.text}</a>
 *       )}
 *       <button onClick={() => markViewed(msg.id)}>
 *         Dismiss
 *       </button>
 *     </div>
 *   ));
 * }
 * ```
 */
export function useMessages(options?: UseMessagesOptions): UseMessagesResult {
  const messaging = useMessagingContext();
  const [messages, setMessages] = useState<InAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled ?? true;
  const pollInterval = options?.pollInterval;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await messaging.getMessages(optionsRef.current);
      setMessages(msgs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [messaging]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let active = true;

    messaging
      .getMessages(optionsRef.current)
      .then((msgs) => {
        if (active) {
          setMessages(msgs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    let tid: ReturnType<typeof setInterval> | undefined;
    if (pollInterval && pollInterval > 0) {
      tid = setInterval(() => {
        if (active) fetchMessages();
      }, pollInterval);
    }

    return () => {
      active = false;
      if (tid) clearInterval(tid);
    };
  }, [enabled, pollInterval, fetchMessages, messaging]);

  const markViewed = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await messaging.markViewed(messageId);
    },
    [messaging],
  );

  return { messages, isLoading, error, markViewed, refresh: fetchMessages };
}

/**
 * Hook to lazily fetch in-app messages on demand.
 *
 * @example
 * ```tsx
 * function InboxButton() {
 *   const { fetch, messages, isLoading } = useLazyMessages();
 *
 *   return (
 *     <>
 *       <button onClick={() => fetch()}>
 *         Check Messages
 *       </button>
 *       {messages.map((msg) => <div key={msg.id}>{msg.title}</div>)}
 *     </>
 *   );
 * }
 * ```
 */
export function useLazyMessages(): {
  fetch: (options?: GetMessagesOptions) => Promise<InAppMessage[] | undefined>;
  messages: InAppMessage[];
  isLoading: boolean;
  error: Error | null;
  markViewed: (messageId: string) => Promise<void>;
  reset: () => void;
} {
  const messaging = useMessagingContext();
  const [messages, setMessages] = useState<InAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(
    async (options?: GetMessagesOptions) => {
      setIsLoading(true);
      setError(null);
      try {
        const msgs = await messaging.getMessages(options);
        setMessages(msgs);
        return msgs;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [messaging],
  );

  const markViewed = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await messaging.markViewed(messageId);
    },
    [messaging],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { fetch: fetchMessages, messages, isLoading, error, markViewed, reset };
}
