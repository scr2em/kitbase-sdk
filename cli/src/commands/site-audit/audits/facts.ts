// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsFacts extends ApiOperationCommand {
	static description = "Get the audit's full graded checklist, passes included";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};

	descriptor = descriptors["getSiteAuditFacts"];
}
