// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsCreate extends ApiOperationCommand {
	static description = "Start a site audit";
	static flags = {
		"maxPages": Flags.integer({ description: "How many pages the crawl may fetch. Bounded by the service's own floor and ceiling; a value outside them is rejected." }),
		"followLinks": Flags.boolean({ description: "Follow internal links as well as the sitemap. False audits only what the sitemap lists, which is faster and blind to anything unlisted." }),
		"targetUrl": Flags.string({ description: "Any http(s) address to audit. Omitted = the project's configured website domain. The address is reduced to its domain — a path or query is discarded, and IP literals, ports and credentials are rejected. Auditing a site other than the project's own counts against a daily allowance." }),
	};

	descriptor = descriptors["startSiteAudit"];
}
