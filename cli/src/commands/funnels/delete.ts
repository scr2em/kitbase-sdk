// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FunnelsDelete extends ApiOperationCommand {
	static description = "Delete a funnel";
	static args = {
		"funnelId": Args.string({ description: "Funnel ID", required: true }),
	};

	descriptor = descriptors["deleteFunnel"];
}
