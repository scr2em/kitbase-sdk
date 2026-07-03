import type { HttpMethod, SpecOperation } from "./spec.js";

export interface NamedOperation {
	operation: SpecOperation;
	/** Topic + verb segments, e.g. ["feature-flags", "list"]. Joined with the topic separator. */
	idSegments: string[];
	needsOrg: boolean;
	needsProject: boolean;
	/** Path param names (excluding orgSlug/projectId), in path order — become positional args. */
	pathParams: string[];
}

function splitPath(path: string): string[] {
	return path.split("/").filter(Boolean);
}

function isParam(segment: string): boolean {
	return segment.startsWith("{") && segment.endsWith("}");
}

function paramName(segment: string): string {
	return segment.slice(1, -1);
}

interface Shape {
	needsOrg: boolean;
	needsProject: boolean;
	chain: string[];
}

/**
 * Strips the {orgSlug} prefix and, when it's acting purely as nested-resource context (i.e.
 * more path follows it), the projects/{projectId} prefix too. When projects/{projectId} is the
 * END of the path (get/update/delete "the project itself"), it's left in place so `{projectId}`
 * becomes a normal positional arg under the "projects" topic instead of resolved context.
 */
function deriveShape(path: string): Shape {
	let segments = splitPath(path);
	let needsOrg = false;
	let needsProject = false;

	if (segments[0] === "{orgSlug}") {
		needsOrg = true;
		segments = segments.slice(1);
	}

	if (segments[0] === "projects" && segments[1] === "{projectId}" && segments.length > 2) {
		needsProject = true;
		segments = segments.slice(2);
	}

	return { needsOrg, needsProject, chain: segments };
}

function methodVerb(method: HttpMethod, isCollectionRoot: boolean): string {
	switch (method) {
		case "get":
			return isCollectionRoot ? "list" : "get";
		case "post":
			return "create";
		case "put":
		case "patch":
			return "update";
		case "delete":
			return "delete";
	}
}

interface DerivedName {
	topic: string[];
	verb: string;
	pathParams: string[];
}

function deriveName(chain: string[], method: HttpMethod, methodsAtPath: Set<HttpMethod>): DerivedName {
	const pathParams = chain.filter(isParam).map(paramName);
	const literals = chain.filter((s) => !isParam(s));
	const last = chain.at(-1);
	const secondLast = chain.at(-2);

	// Case 1: path ends on a param, e.g. .../feature-flags/{flagKey} -> get/update/delete.
	if (last !== undefined && isParam(last)) {
		return { topic: literals, verb: methodVerb(method, false), pathParams };
	}

	// Case 2: literal action word directly after a param, e.g. .../jobs/{jobId}/pause -> "pause".
	// But if multiple methods share this exact sub-path (e.g. GET+DELETE .../views), it's really
	// a nested collection, not a single named action — fold the word into the topic instead and
	// use the method-based verb, same as Case 3's collection branch.
	if (last !== undefined && secondLast !== undefined && isParam(secondLast)) {
		if (methodsAtPath.size > 1) {
			return { topic: literals, verb: methodVerb(method, true), pathParams };
		}
		return { topic: literals.slice(0, -1), verb: last, pathParams };
	}

	// Case 3: bare literal tail. A true collection root (this exact path answers >1 HTTP verb,
	// or there's nothing shorter to fall back to) uses method-based verbs; a lone single-method
	// path ending in a descriptive noun (analytics views, named actions) uses that noun as the verb.
	const isCollectionRoot = methodsAtPath.size > 1 || literals.length <= 1;
	if (isCollectionRoot) {
		return { topic: literals, verb: methodVerb(method, true), pathParams };
	}
	return { topic: literals.slice(0, -1), verb: last as string, pathParams };
}

export function nameOperation(operation: SpecOperation, methodsAtPath: Set<HttpMethod>): NamedOperation {
	const { needsOrg, needsProject, chain } = deriveShape(operation.path);
	const { topic, verb, pathParams } = deriveName(chain, operation.method, methodsAtPath);

	return {
		operation,
		idSegments: [...topic, verb],
		needsOrg,
		needsProject,
		pathParams,
	};
}
