// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsList extends ApiOperationCommand {
	static description = "List site audits";
	static flags = {
		"limit": Flags.integer({  }),
	};

	descriptor = descriptors["listSiteAudits"];
}
