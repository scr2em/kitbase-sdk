import { randomBytes } from "node:crypto";
import http from "node:http";
import os from "node:os";
import type { AddressInfo } from "node:net";

import chalk from "chalk";
import open from "open";

import { BaseCommand } from "../base-command.js";
import { resolveBaseUrl } from "../lib/config.js";
import { createLoginSession, pollLoginSession, storeLoginTokens } from "../lib/auth.js";
import { getCredentials } from "../lib/credentials.js";
import { AuthenticationError } from "../lib/errors.js";
import { CLI_VERSION } from "../lib/version.js";

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Starts a loopback HTTP server for the instant browser -> CLI handoff. Returns `null` if the
 * server can't be started (sandboxed environment, etc) — pure polling still works without it. */
async function startLoopbackServer(
	state: string,
): Promise<{ port: number; waitForPing: () => Promise<void>; close: () => void } | null> {
	let pingRequested = false;
	let pingWaiter: (() => void) | null = null;

	try {
		const server = http.createServer((req, res) => {
			const url = new URL(req.url ?? "/", "http://127.0.0.1");
			if (url.pathname === "/callback" && url.searchParams.get("state") === state) {
				res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
				res.end("<html><body>You're signed in — you can close this tab and return to your terminal.</body></html>");
				pingRequested = true;
				pingWaiter?.();
			} else {
				res.writeHead(404);
				res.end();
			}
		});

		await new Promise<void>((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});

		const port = (server.address() as AddressInfo).port;

		return {
			port,
			waitForPing: () =>
				new Promise<void>((resolve) => {
					if (pingRequested) {
						pingRequested = false;
						resolve();
						return;
					}
					pingWaiter = () => {
						pingRequested = false;
						pingWaiter = null;
						resolve();
					};
				}),
			close: () => server.close(),
		};
	} catch {
		return null;
	}
}

export default class Login extends BaseCommand {
	static description = "Log in to Kitbase via your browser.";

	async run(): Promise<void> {
		const { flags } = await this.parse(Login);
		const baseUrl = resolveBaseUrl(flags);

		if (getCredentials(baseUrl)) {
			this.log(chalk.dim(`Already logged in to ${baseUrl} — starting a new login will replace this session.`));
		}

		const state = randomBytes(16).toString("hex");
		const loopback = await startLoopbackServer(state);

		const session = await createLoginSession(baseUrl, {
			deviceName: `${os.userInfo().username}@${os.hostname()}`,
			clientVersion: CLI_VERSION,
			loopbackPort: loopback?.port,
			state: loopback ? state : undefined,
		});

		this.log("");
		this.log(chalk.dim("Confirm this code in your browser:"));
		this.log(chalk.bold.cyan(`\n  ${session.userCode}\n`));
		this.log(chalk.dim("If your browser didn't open, visit:"));
		this.log(`  ${session.verificationUrl}`);
		this.log("");

		await open(session.verificationUrl).catch(() => {
			// Non-fatal — the URL is already printed above.
		});

		try {
			const tokens = await this.waitForApproval(baseUrl, session, loopback);
			storeLoginTokens(baseUrl, tokens);
			this.log(chalk.green(`Logged in as ${tokens.user?.email ?? "unknown user"}.`));
		} finally {
			loopback?.close();
		}
	}

	private async waitForApproval(
		baseUrl: string,
		session: Awaited<ReturnType<typeof createLoginSession>>,
		loopback: Awaited<ReturnType<typeof startLoopbackServer>>,
	) {
		const deadline = Date.parse(session.expiresAt);
		let intervalSeconds = session.pollIntervalSeconds;

		const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		let frame = 0;

		while (Date.now() < deadline) {
			process.stdout.write(`\r${chalk.dim(spinner[frame % spinner.length]!)} Waiting for approval...`);
			frame++;

			const result = await pollLoginSession(baseUrl, session.sessionId, session.pollSecret);

			if (result.status === "authenticated") {
				process.stdout.write("\r" + " ".repeat(30) + "\r");
				return result.tokens;
			}
			if (result.status === "denied") {
				process.stdout.write("\r" + " ".repeat(30) + "\r");
				throw new AuthenticationError("Login request was denied.");
			}
			if (result.status === "expired") {
				process.stdout.write("\r" + " ".repeat(30) + "\r");
				throw new AuthenticationError("Login request expired. Run `kitbase login` again.");
			}

			intervalSeconds = result.pollIntervalSeconds;
			await Promise.race([sleep(intervalSeconds * 1000), loopback?.waitForPing() ?? sleep(intervalSeconds * 1000)]);
		}

		process.stdout.write("\r" + " ".repeat(30) + "\r");
		throw new AuthenticationError("Login request expired. Run `kitbase login` again.");
	}
}
