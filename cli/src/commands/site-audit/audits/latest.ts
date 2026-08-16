// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsLatest extends ApiOperationCommand {
	static description = "Get the latest site audit with live progress";
	static flags = {
		"completedOnly": Flags.boolean({ description: "Only consider audits whose job completed." }),
		"target": Flags.string({ description: "`own` considers only audits of the project's configured website; `any` also considers audits of other sites.", options: ["own","any"] }),
	};

	descriptor = descriptors["getLatestSiteAudit"];
}
