// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentPagesAudit extends ApiOperationCommand {
	static description = "Grade one page against the rest of the site";
	static flags = {
		"path": Flags.string({ description: "The indexed page's path", required: true }),
	};

	descriptor = descriptors["auditSiteContentPage"];
}
