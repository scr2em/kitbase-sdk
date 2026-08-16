// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteSpecRulesUpdate extends ApiOperationCommand {
	static description = "Approve, reject or correct one rule";
	static args = {
		"ruleId": Args.string({ description: "ruleId", required: true }),
	};
	static flags = {
		"status": Flags.string({ options: ["APPROVED","REJECTED"] }),
		"scope": Flags.string({ description: "Set to correct the rule while approving it" }),
		"expectedValue": Flags.string({  }),
		"lockLevel": Flags.string({ options: ["LOCKED","RESEARCH_BACKED","OPEN"] }),
	};

	descriptor = descriptors["reviewSpecRule"];
}
