// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../../runtime/operation-command.js";
import { descriptors } from "../../../../generated/descriptors.js";

export default class SiteAuditAuditsFindingsGroups extends ApiOperationCommand {
	static description = "List an audit's findings, grouped by rule";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};

	descriptor = descriptors["listSiteAuditFindingGroups"];
}
