// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsCancel extends ApiOperationCommand {
	static description = "Cancel a running site audit";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};

	descriptor = descriptors["cancelSiteAudit"];
}
