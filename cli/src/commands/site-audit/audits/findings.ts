// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsFindings extends ApiOperationCommand {
	static description = "List an audit's findings";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};
	static flags = {
		"source": Flags.string({ options: ["CRAWL","CHECKLIST","PAGE_CHECK","SITE_CHECK","CONTENT_CHECK"] }),
		"findingId": Flags.string({  }),
		"severity": Flags.string({ options: ["CRITICAL","WARNING","INFO"] }),
		"scope": Flags.string({ options: ["PAGE","SITE"] }),
		"q": Flags.string({ description: "Substring match on the page URL" }),
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listSiteAuditFindings"];
}
