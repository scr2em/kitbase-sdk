import { Flags } from "@oclif/core";

import { BaseCommand } from "../base-command.js";
import { createApiClient, unwrapResponse } from "../lib/api.js";
import { resolveOrg, resolveProject } from "../lib/context.js";
import { parseDataFlag } from "../lib/data-flag.js";
import { printResult } from "../lib/output.js";
import { inputText } from "../lib/prompts.js";
import { ValidationError } from "../lib/errors.js";
import type { OperationDescriptor } from "./descriptor.js";

/**
 * Shared implementation behind every generated command. A generated command file is just
 * static metadata (description/flags/args for oclif's help & manifest) plus a `descriptor`
 * pointing at its entry in `generated/descriptors.ts` — this class does the actual work of
 * resolving context, building the request, and rendering the response.
 */
export abstract class ApiOperationCommand extends BaseCommand {
	static baseFlags = {
		...BaseCommand.baseFlags,
		data: Flags.string({
			char: "d",
			description: "Request body as a JSON object, @file.json, or - for stdin. Individual field flags override matching keys.",
		}),
	};

	protected abstract descriptor: OperationDescriptor;

	async run(): Promise<void> {
		const { flags, args } = await this.parse();
		const descriptor = this.descriptor;

		const baseFlags = {
			baseUrl: flags["base-url"] as string | undefined,
			local: flags.local as boolean | undefined,
			apiKey: flags["api-key"] as string | undefined,
			org: flags.org as string | undefined,
			project: flags.project as string | undefined,
		};

		const orgSlug = descriptor.needsOrg ? await resolveOrg(baseFlags) : undefined;
		const projectId = descriptor.needsProject ? await resolveProject(baseFlags, orgSlug as string) : undefined;

		const pathParams: Record<string, string> = {};
		if (orgSlug !== undefined) pathParams.orgSlug = orgSlug;
		if (projectId !== undefined) pathParams.projectId = projectId;
		for (const name of descriptor.pathParams) {
			const value = (args as Record<string, unknown>)[name];
			if (value === undefined) {
				throw new ValidationError(`Missing required argument: ${name}`);
			}
			pathParams[name] = String(value);
		}

		const query: Record<string, unknown> = {};
		for (const name of descriptor.queryParams) {
			const value = (flags as Record<string, unknown>)[name];
			if (value !== undefined) query[name] = value;
		}

		const body = await this.buildBody(descriptor, flags as Record<string, unknown>);

		const init: Record<string, unknown> = {};
		if (Object.keys(pathParams).length > 0 || Object.keys(query).length > 0) {
			init.params = {
				...(Object.keys(pathParams).length > 0 ? { path: pathParams } : {}),
				...(Object.keys(query).length > 0 ? { query } : {}),
			};
		}
		if (body !== undefined) {
			init.body = body;
		}

		const { client } = createApiClient(baseFlags);
		// The dynamic method dispatch below is inherently untyped — this one call site handles
		// all ~160 operations. Type safety instead comes from the codegen: descriptors.ts is
		// checked against `keyof paths`, and each generated command's flags/args are typed from
		// the real spec at generation time.
		const method = descriptor.method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await (client as any)[method](descriptor.path, init);
		const data = unwrapResponse(result);

		printResult(data, { json: Boolean(flags.json) });
	}

	private async buildBody(
		descriptor: OperationDescriptor,
		flags: Record<string, unknown>,
	): Promise<Record<string, unknown> | undefined> {
		if (descriptor.bodyFields.length === 0) {
			return undefined;
		}

		const body: Record<string, unknown> = typeof flags.data === "string" ? await parseDataFlag(flags.data) : {};

		for (const field of descriptor.bodyFields) {
			if (flags[field] !== undefined) {
				body[field] = flags[field];
			}
		}

		const missingRequired = descriptor.requiredBodyFields.filter((field) => body[field] === undefined);
		if (missingRequired.length > 0) {
			if (process.stdin.isTTY) {
				for (const field of missingRequired) {
					body[field] = await inputText(`${field}:`, { required: true });
				}
			} else {
				throw new ValidationError(
					`Missing required field(s): ${missingRequired.join(", ")}. Pass them as flags or via --data.`,
				);
			}
		}

		return Object.keys(body).length > 0 ? body : undefined;
	}
}
