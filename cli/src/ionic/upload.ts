import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import type { KitbaseConfig } from "../lib/types.js";
import type { UploadPayload, UploadResponse } from "./types.js";
import { ApiError, AuthenticationError, ValidationError } from "../lib/errors.js";
import { getBaseUrl } from "../lib/config.js";
const TIMEOUT = 300_000; // 5 minutes

export interface UploadProgress {
	uploaded: number;
	total: number;
	percent: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

export interface UploadOptions {
	onProgress?: ProgressCallback;
}

export class UploadClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor(config: KitbaseConfig) {
		if (!config.apiKey) throw new ValidationError("API key is required", "apiKey");
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || getBaseUrl();
	}

	async upload(payload: UploadPayload, options?: UploadOptions): Promise<UploadResponse> {
		this.validatePayload(payload);

		const { body, boundary } = this.createMultipartBody(payload);
		const url = new URL(`${this.baseUrl}/sdk/v1/builds`);

		return new Promise((resolve, reject) => {
			const isHttps = url.protocol === "https:";
			const requestFn = isHttps ? httpsRequest : httpRequest;

			const req = requestFn(
				{
					hostname: url.hostname,
					port: url.port || (isHttps ? 443 : 80),
					path: url.pathname,
					method: "POST",
					headers: {
						"Content-Type": `multipart/form-data; boundary=${boundary}`,
						"Content-Length": body.length,
						"X-API-Key": this.apiKey,
					},
					timeout: TIMEOUT,
				},
				(res) => {
					let responseData = "";
					res.on("data", (chunk) => (responseData += chunk));
					res.on("end", () => {
						try {
							const statusCode = res.statusCode || 0;

							if (statusCode === 401 || statusCode === 403) {
								reject(new AuthenticationError());
								return;
							}

							if (statusCode >= 400) {
								let errorBody: unknown;
								try {
									errorBody = JSON.parse(responseData);
								} catch {
									errorBody = null;
								}
								reject(
									new ApiError(
										this.extractErrorMessage(errorBody, res.statusMessage || "Unknown error"),
										statusCode,
										errorBody,
									),
								);
								return;
							}

							resolve(JSON.parse(responseData) as UploadResponse);
						} catch (error) {
							reject(new ApiError(`Failed to parse response: ${error}`, 0));
						}
					});
				},
			);

			req.on("error", (error) => reject(new ApiError(`Upload failed: ${error.message}`, 0)));
			req.on("timeout", () => {
				req.destroy();
				reject(new ApiError("Upload timed out. Please try again.", 408));
			});

			if (options?.onProgress) {
				const total = body.length;
				let uploaded = 0;
				const chunkSize = 64 * 1024;

				const writeChunk = (offset: number) => {
					const end = Math.min(offset + chunkSize, total);
					const chunk = body.slice(offset, end);
					const canContinue = req.write(chunk);
					uploaded = end;

					options.onProgress!({ uploaded, total, percent: Math.round((uploaded / total) * 100) });

					if (uploaded < total) {
						if (canContinue) {
							setImmediate(() => writeChunk(end));
						} else {
							req.once("drain", () => writeChunk(end));
						}
					} else {
						req.end();
					}
				};

				writeChunk(0);
			} else {
				req.write(body);
				req.end();
			}
		});
	}

	private validatePayload(payload: UploadPayload): void {
		if (!payload.commitHash) throw new ValidationError("Commit hash is required", "commitHash");
		if (!payload.branchName) throw new ValidationError("Branch name is required", "branchName");
		if (!payload.nativeVersion)
			throw new ValidationError("Native version is required", "nativeVersion");
		if (!payload.file || payload.file.length === 0)
			throw new ValidationError("Build file is required", "file");
	}

	private createMultipartBody(payload: UploadPayload): { body: Buffer; boundary: string } {
		const boundary = `----KitbaseBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
		const parts: Buffer[] = [];

		const textFields: Record<string, string> = {
			commitHash: payload.commitHash,
			branchName: payload.branchName,
			nativeVersion: payload.nativeVersion,
		};
		if (payload.commitMessage) textFields.commitMessage = payload.commitMessage;

		for (const [name, value] of Object.entries(textFields)) {
			parts.push(
				Buffer.from(
					`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
				),
			);
		}

		parts.push(
			Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${payload.fileName}"\r\nContent-Type: application/zip\r\n\r\n`,
			),
		);
		parts.push(payload.file);
		parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

		return { body: Buffer.concat(parts), boundary };
	}

	private extractErrorMessage(body: unknown, fallback: string): string {
		if (body && typeof body === "object") {
			const b = body as Record<string, unknown>;
			if (typeof b.message === "string") return b.message;
			if (typeof b.error === "string") return b.error;
			const nested = b.error as Record<string, unknown> | undefined;
			if (typeof nested?.message === "string") return nested.message;
		}
		return fallback;
	}
}

export function createUploadPayload(
	filePath: string,
	gitInfo: { commitHash: string; branchName: string; commitMessage?: string },
	nativeVersion: string,
): UploadPayload {
	return {
		commitHash: gitInfo.commitHash,
		branchName: gitInfo.branchName,
		commitMessage: gitInfo.commitMessage,
		nativeVersion,
		file: readFileSync(filePath),
		fileName: basename(filePath),
	};
}