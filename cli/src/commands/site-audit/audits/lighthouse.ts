// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteAuditAuditsLighthouse extends ApiOperationCommand {
	static description = "List an audit's Lighthouse measurements";
	static args = {
		"auditId": Args.string({ description: "auditId", required: true }),
	};
	static flags = {
		"q": Flags.string({ description: "Substring match on the URL" }),
		"device": Flags.string({ options: ["ALL","MOBILE","DESKTOP"] }),
		"band": Flags.string({ description: "Performance score band, on the same thresholds the rings use: GOOD >= 90, NEEDS_WORK >= 50, POOR below that.", options: ["ALL","GOOD","NEEDS_WORK","POOR"] }),
		"failuresOnly": Flags.boolean({ description: "Only measurements the provider could not complete" }),
		"sort": Flags.string({ options: ["PERFORMANCE","URL","LCP","CLS","TTFB"] }),
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listSiteAuditLighthouse"];
}
