// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AuditLogsList extends ApiOperationCommand {
	static description = "Get audit logs for an organization";
	static flags = {
		"action": Flags.string({ description: "Filter by action (e.g., PROJECT_CREATED)" }),
		"resourceType": Flags.string({ description: "Filter by resource type (e.g., PROJECT)" }),
		"userId": Flags.string({ description: "Filter by user ID" }),
		"startDate": Flags.string({ description: "Filter by start date" }),
		"endDate": Flags.string({ description: "Filter by end date" }),
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
		"sort": Flags.string({ description: "Sort order by created date", options: ["asc","desc"] }),
	};

	descriptor = descriptors["getAuditLogs"];
}
