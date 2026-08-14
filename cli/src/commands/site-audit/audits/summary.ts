// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsSummary extends ApiOperationCommand {
	static description = "Get one audit's headline statistics";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};

	descriptor = descriptors["getSiteAuditSummary"];
}
