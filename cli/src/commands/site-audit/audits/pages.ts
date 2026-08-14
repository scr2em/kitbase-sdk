// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsPages extends ApiOperationCommand {
	static description = "List an audit's crawled pages";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};
	static flags = {
		"q": Flags.string({ description: "Substring match on the URL" }),
		"status": Flags.string({ options: ["ALL","OK","REDIRECT","BROKEN","SERVER_ERROR","BLOCKED","MISSING"] }),
		"missingAlt": Flags.boolean({ description: "Only pages carrying at least one image without alt text" }),
		"indexable": Flags.boolean({  }),
		"minDepth": Flags.integer({  }),
		"sort": Flags.string({ options: ["URL","STATUS","SPEED","WORDS","DEPTH"] }),
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listSiteAuditPages"];
}
