import type { InAppMessage, MessageType, GetMessagesOptions } from "./types.js";
import { ApiError, AuthenticationError, TimeoutError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.kitbase.dev";
const TIMEOUT = 30000;

/** Raw API response shape (internal) */
interface SdkInAppMessageResponse {
	id: string;
	title: string;
	message: string;
	showOnce: boolean;
	messageType: string;
	channelName: string;
	imageUrl?: string;
	actionButtonText?: string;
	actionButtonUrl?: string;
	actionButtonColor?: string;
	actionButtonTextColor?: string;
	secondaryButtonText?: string;
	secondaryButtonUrl?: string;
	secondaryButtonColor?: string;
	secondaryButtonTextColor?: string;
	backgroundColor?: string;
	startDate?: string;
	endDate?: string;
}

/**
 * Low-level HTTP client for the in-app messages API.
 * @internal
 */
export class MessagingApi {
	private readonly baseUrl: string;

	constructor(
		private readonly sdkKey: string,
		baseUrl?: string,
	) {
		this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
	}

	async getMessages(options?: GetMessagesOptions): Promise<InAppMessage[]> {
		const params: Record<string, string> = {};
		if (options?.userId) params.userId = options.userId;
		if (options?.metadata) params.metadata = JSON.stringify(options.metadata);

		const response = await this.get<{ messages: SdkInAppMessageResponse[] }>(
			"/sdk/v1/in-app-messages",
			params,
		);

		return response.messages.map(toInAppMessage);
	}

	async markViewed(messageId: string, userId: string): Promise<void> {
		await this.post("/sdk/v1/in-app-messages/views", { messageId, userId });
	}

	// ── HTTP ──────────────────────────────────────────────────────

	private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
		let url = `${this.baseUrl}${endpoint}`;
		if (params && Object.keys(params).length > 0) {
			const qs = Object.entries(params)
				.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join("&");
			url += `?${qs}`;
		}

		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), TIMEOUT);

		try {
			const res = await fetch(url, {
				method: "GET",
				headers: { "Content-Type": "application/json", "x-sdk-key": this.sdkKey },
				signal: controller.signal,
			});
			clearTimeout(tid);
			if (!res.ok) this.throwError(res, await this.parseBody(res));
			return (await res.json()) as T;
		} catch (err) {
			clearTimeout(tid);
			if (err instanceof Error && err.name === "AbortError") throw new TimeoutError();
			throw err;
		}
	}

	private async post(endpoint: string, body: unknown): Promise<void> {
		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), TIMEOUT);

		try {
			const res = await fetch(`${this.baseUrl}${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json", "x-sdk-key": this.sdkKey },
				body: JSON.stringify(body),
				signal: controller.signal,
			});
			clearTimeout(tid);
			if (!res.ok) this.throwError(res, await this.parseBody(res));
		} catch (err) {
			clearTimeout(tid);
			if (err instanceof Error && err.name === "AbortError") throw new TimeoutError();
			throw err;
		}
	}

	private throwError(res: Response, body: unknown): never {
		if (res.status === 401) throw new AuthenticationError();
		let msg = res.statusText;
		if (body && typeof body === "object") {
			if ("message" in body) msg = String((body as any).message);
			else if ("error" in body) msg = String((body as any).error);
		}
		throw new ApiError(msg, res.status, body);
	}

	private async parseBody(res: Response): Promise<unknown> {
		try {
			return await res.json();
		} catch {
			return null;
		}
	}
}

// ── Response mapping ────────────────────────────────────────────

function toInAppMessage(raw: SdkInAppMessageResponse): InAppMessage {
	const msg: InAppMessage = {
		id: raw.id,
		title: raw.title,
		body: raw.message,
		showOnce: raw.showOnce,
		type: raw.messageType as MessageType,
		channel: raw.channelName || null,
		imageUrl: raw.imageUrl,
		backgroundColor: raw.backgroundColor,
		startDate: raw.startDate,
		endDate: raw.endDate,
	};

	if (raw.actionButtonText) {
		msg.actionButton = {
			text: raw.actionButtonText,
			url: raw.actionButtonUrl!,
			color: raw.actionButtonColor,
			textColor: raw.actionButtonTextColor,
		};
	}

	if (raw.secondaryButtonText) {
		msg.secondaryButton = {
			text: raw.secondaryButtonText,
			url: raw.secondaryButtonUrl!,
			color: raw.secondaryButtonColor,
			textColor: raw.secondaryButtonTextColor,
		};
	}

	return msg;
}