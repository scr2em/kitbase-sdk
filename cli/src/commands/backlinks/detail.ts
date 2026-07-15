// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksDetail extends ApiOperationCommand {
	static description = "Drill into one backlink source";
	static flags = {
		"domain": Flags.string({ description: "Normalized referring host as returned by the list endpoint", required: true }),
		"days": Flags.integer({ description: "Window in days for the timeline and landing paths" }),
	};

	descriptor = descriptors["getBacklinkSourceDetail"];
}
