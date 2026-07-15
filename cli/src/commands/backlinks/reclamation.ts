// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksReclamation extends ApiOperationCommand {
	static description = "Dead pages still receiving referred traffic";
	static flags = {
		"days": Flags.integer({ description: "Window in days for referred-session counts" }),
	};

	descriptor = descriptors["getBacklinkReclamation"];
}
