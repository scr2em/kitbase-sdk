import { describe, it, expect } from "vitest";
import { nameOperation } from "./naming.js";
import type { HttpMethod, SpecOperation } from "./spec.js";

// These tests encode the *intended* command-naming rules (what id/args/context a given path
// shape should produce), not a snapshot of whatever nameOperation currently returns. Each case
// is chosen because it's either a documented rule or a real collision this algorithm must avoid
// (see scripts/codegen/overrides.ts for the handful of cases the algorithm still gets wrong and
// a human has to override).

function op(path: string, method: HttpMethod, operationId = "op"): SpecOperation {
	return { path, method, operationId, tags: [], parameters: [], bodyFields: [] };
}

function methods(...ms: HttpMethod[]): Set<HttpMethod> {
	return new Set(ms);
}

describe("nameOperation", () => {
	describe("{orgSlug} and projects/{projectId} context stripping", () => {
		it("treats a leading {orgSlug} segment as resolved context, not a positional arg", () => {
			const named = nameOperation(op("/{orgSlug}/audit-logs", "get"), methods("get"));
			expect(named.needsOrg).toBe(true);
			expect(named.pathParams).not.toContain("orgSlug");
		});

		it("does not require org context for a path with no {orgSlug} segment", () => {
			const named = nameOperation(op("/organizations", "get"), methods("get", "post"));
			expect(named.needsOrg).toBe(false);
		});

		it("resolves projects/{projectId} as context when more path follows it", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/feature-flags", "get"),
				methods("get", "post"),
			);
			expect(named.needsProject).toBe(true);
			expect(named.pathParams).not.toContain("projectId");
			expect(named.idSegments).toEqual(["feature-flags", "list"]);
		});

		it("keeps {projectId} as an explicit positional arg when it's the end of the path", () => {
			// GET/PATCH/DELETE .../projects/{projectId} operate on "the project" identified by the
			// arg itself — treating it as ambient "resolved" context would be wrong (there is no
			// other project to resolve context *from*).
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}", "get"),
				methods("get", "patch", "delete"),
			);
			expect(named.needsProject).toBe(false);
			expect(named.pathParams).toEqual(["projectId"]);
			expect(named.idSegments).toEqual(["projects", "get"]);
		});

		it("keeps the bare projects collection as its own topic (list/create), not stripped away", () => {
			const list = nameOperation(op("/{orgSlug}/projects", "get"), methods("get", "post"));
			const create = nameOperation(op("/{orgSlug}/projects", "post"), methods("get", "post"));
			expect(list.idSegments).toEqual(["projects", "list"]);
			expect(create.idSegments).toEqual(["projects", "create"]);
		});
	});

	describe("Case 1 — path ends on a param", () => {
		const methodsAtPath = methods("get", "patch", "delete");

		it("maps GET to get", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/feature-flags/{flagKey}", "get"),
				methodsAtPath,
			);
			expect(named.idSegments).toEqual(["feature-flags", "get"]);
			expect(named.pathParams).toEqual(["flagKey"]);
		});

		it("maps PATCH and PUT to update", () => {
			const patch = nameOperation(
				op("/{orgSlug}/projects/{projectId}/feature-flags/{flagKey}", "patch"),
				methodsAtPath,
			);
			const put = nameOperation(op("/{orgSlug}/projects/{projectId}/funnels/{funnelId}", "put"), methods("put"));
			expect(patch.idSegments).toEqual(["feature-flags", "update"]);
			expect(put.idSegments).toEqual(["funnels", "update"]);
		});

		it("maps DELETE to delete", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/feature-flags/{flagKey}", "delete"),
				methodsAtPath,
			);
			expect(named.idSegments).toEqual(["feature-flags", "delete"]);
		});

		it("captures any earlier embedded params (not just the trailing one) as positional args, in path order", () => {
			const named = nameOperation(
				op(
					"/{orgSlug}/projects/{projectId}/integrations/{provider}/subscriptions/{subscriptionId}",
					"get",
				),
				methods("get", "patch", "delete"),
			);
			expect(named.idSegments).toEqual(["integrations", "subscriptions", "get"]);
			expect(named.pathParams).toEqual(["provider", "subscriptionId"]);
		});
	});

	describe("Case 2 — literal action word directly after a param", () => {
		it("uses the literal word as the verb when this sub-path answers only one HTTP method", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/ai-visibility/jobs/{jobId}/pause", "post"),
				methods("post"),
			);
			expect(named.idSegments).toEqual(["ai-visibility", "jobs", "pause"]);
			expect(named.pathParams).toEqual(["jobId"]);
		});

		it("falls back to method-based verbs when multiple methods share the exact sub-path", () => {
			// GET (list views) and DELETE (clear all views) at the same path are a collection, not
			// two named actions — "views" must become part of the topic, not get treated as a verb
			// by one of them and dropped for the other (that's exactly how these two used to collide).
			const path = "/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views";
			const list = nameOperation(op(path, "get"), methods("get", "delete"));
			const clear = nameOperation(op(path, "delete"), methods("get", "delete"));

			expect(list.idSegments).toEqual(["in-app-messages", "views", "list"]);
			expect(clear.idSegments).toEqual(["in-app-messages", "views", "delete"]);
			expect(list.pathParams).toEqual(["messageId"]);
		});

		it("(known limitation) collides 'clear all views' with 'delete one view by id' — this is exactly why overrides.ts exists", () => {
			// deleteInAppMessageView (.../views/{viewId}, Case 1) and clearInAppMessageViews
			// (.../views, Case 2 multi-method) both mechanically resolve to topic ["in-app-messages",
			// "views"] + verb "delete". naming.ts alone cannot disambiguate this — see the
			// "known collisions resolved by overrides.ts" suite below for the actual fix, and
			// generate-commands.test.ts for proof the shipped config has zero *unresolved* collisions.
			const clearAll = nameOperation(
				op("/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views", "delete"),
				methods("get", "delete"),
			);
			const deleteOne = nameOperation(
				op("/{orgSlug}/projects/{projectId}/in-app-messages/{messageId}/views/{viewId}", "delete"),
				methods("delete"),
			);
			expect(clearAll.idSegments).toEqual(deleteOne.idSegments);
		});
	});

	describe("Case 3 — bare literal tail (no trailing/preceding param)", () => {
		it("uses list/create for a genuine multi-method collection", () => {
			const path = "/{orgSlug}/projects/{projectId}/settings";
			const get = nameOperation(op(path, "get"), methods("get", "patch"));
			const patch = nameOperation(op(path, "patch"), methods("get", "patch"));
			expect(get.idSegments).toEqual(["settings", "list"]);
			expect(patch.idSegments).toEqual(["settings", "update"]);
		});

		it("uses list for a single top-level literal segment, even with only one HTTP method", () => {
			// A bare one-segment path (audit-logs, notifications, members, ...) is always a
			// collection in this API — there's nowhere shorter to fall back to as a topic anyway.
			const named = nameOperation(op("/{orgSlug}/audit-logs", "get"), methods("get"));
			expect(named.idSegments).toEqual(["audit-logs", "list"]);
		});

		it("uses the literal word itself as the verb for a lone single-method descriptive action, dropping it from the topic", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/funnels/analyze", "post"),
				methods("post"),
			);
			expect(named.idSegments).toEqual(["funnels", "analyze"]);
			expect(named.pathParams).toEqual([]);
		});

		it("does not misinterpret a single-method descriptive GET as a list", () => {
			const named = nameOperation(
				op("/{orgSlug}/projects/{projectId}/web-analytics/breakdown", "get"),
				methods("get"),
			);
			// "breakdown" is the verb, "web-analytics" is the topic — not "web-analytics breakdown list".
			expect(named.idSegments).toEqual(["web-analytics", "breakdown"]);
		});
	});

	describe("idSegments determinism", () => {
		it("is a pure function of (path, method, methodsAtPath) — same input always yields same output", () => {
			const a = nameOperation(op("/{orgSlug}/projects/{projectId}/feature-flags", "post"), methods("get", "post"));
			const b = nameOperation(op("/{orgSlug}/projects/{projectId}/feature-flags", "post"), methods("get", "post"));
			expect(a).toEqual(b);
		});
	});
});
