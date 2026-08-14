// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsCreate extends ApiOperationCommand {
	static description = "Start a site audit";
	static flags = {
		"maxPages": Flags.integer({ description: "How many pages the crawl may fetch. Bounded by the service's own floor and ceiling; a value outside them is rejected." }),
		"followLinks": Flags.boolean({ description: "Follow internal links as well as the sitemap. False audits only what the sitemap lists, which is faster and blind to anything unlisted." }),
	};

	descriptor = descriptors["startSiteAudit"];
}
