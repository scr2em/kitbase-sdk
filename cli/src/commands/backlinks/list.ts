// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksList extends ApiOperationCommand {
	static description = "List detected backlink sources";
	static flags = {
		"page": Flags.integer({ description: "Zero-based page index" }),
		"size": Flags.integer({ description: "Number of sources per result page (1–200)" }),
		"sort": Flags.string({ description: "Sort by discovery recency or by referred sessions in the window", options: ["first_seen","sessions"] }),
		"status": Flags.string({ description: "Server-side status filter", options: ["all","active","ignored"] }),
		"q": Flags.string({ description: "Case-insensitive substring match on the domain" }),
		"days": Flags.integer({ description: "Window in days for the live session counts" }),
	};

	descriptor = descriptors["listBacklinkSources"];
}
