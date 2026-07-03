export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Everything the shared runtime needs to execute one OpenAPI operation. One of these is
 * generated per operation into `generated/descriptors.ts`; the corresponding generated command
 * file just points `descriptor` at its entry and declares the matching oclif flags/args.
 */
export interface OperationDescriptor {
	method: HttpMethod;
	/** The literal templated path, e.g. "/{orgSlug}/projects/{projectId}/feature-flags". */
	path: string;
	needsOrg: boolean;
	needsProject: boolean;
	/** Path params other than orgSlug/projectId, in path order — these become positional args. */
	pathParams: string[];
	/** Query parameter names, exposed as flags. */
	queryParams: string[];
	/** Top-level JSON request body field names, exposed as flags (and via --data). */
	bodyFields: string[];
	/** Subset of bodyFields that are required by the schema. */
	requiredBodyFields: string[];
}
