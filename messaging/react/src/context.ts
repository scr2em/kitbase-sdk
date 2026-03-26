import { createContext, useContext } from "react";
import type { Messaging } from "@kitbase/messaging";

export const MessagingContext = createContext<Messaging | null>(null);

export function useMessagingContext(): Messaging {
	const context = useContext(MessagingContext);

	if (!context) {
		throw new Error(
			"useMessagingContext must be used within a MessagingProvider. " +
				'Wrap your component with <MessagingProvider config={{ sdkKey: "..." }}>',
		);
	}

	return context;
}