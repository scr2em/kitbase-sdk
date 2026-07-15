// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksUpdate extends ApiOperationCommand {
	static description = "Update a backlink source's status";
	static args = {
		"backlinkId": Args.string({ description: "Backlink source ID", required: true }),
	};
	static flags = {
		"status": Flags.string({ description: "Whether the backlink source is shown (active) or dismissed as noise (ignored)", options: ["active","ignored"] }),
	};

	descriptor = descriptors["updateBacklinkSource"];
}
