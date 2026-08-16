// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../../runtime/operation-command.js";
import { descriptors } from "../../../../generated/descriptors.js";

export default class SiteAuditAuditsPagesGet extends ApiOperationCommand {
	static description = "Get one crawled page in full";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
		"pageId": Args.string({ description: "pageId", required: true }),
	};

	descriptor = descriptors["getSiteAuditPage"];
}
