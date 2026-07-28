// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksLinks extends ApiOperationCommand {
	static description = "Exact backlinks pointing at the site";
	static flags = {
		"page": Flags.integer({ description: "Zero-based page index" }),
		"size": Flags.integer({ description: "Page size" }),
		"domain": Flags.string({ description: "Narrow the list to links from this one referring domain. Case-insensitive." }),
		"q": Flags.string({ description: "Substring match on the linking page URL or anchor text" }),
	};

	descriptor = descriptors["listBacklinkLinks"];
}
