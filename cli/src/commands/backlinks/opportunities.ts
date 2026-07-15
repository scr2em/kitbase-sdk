// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksOpportunities extends ApiOperationCommand {
	static description = "AI-cited domains to seek links from";
	static flags = {
		"jobs": Flags.integer({ description: "Number of most recent completed AI-visibility jobs to aggregate" }),
		"limit": Flags.integer({ description: "Maximum number of domains to return" }),
	};

	descriptor = descriptors["getBacklinkOpportunities"];
}
