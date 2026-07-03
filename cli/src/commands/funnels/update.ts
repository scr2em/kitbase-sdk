// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FunnelsUpdate extends ApiOperationCommand {
	static description = "Update a funnel";
	static args = {
		"funnelId": Args.string({ description: "Funnel ID", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "Funnel display name" }),
		"analysisMode": Flags.string({ description: "Funnel analysis grouping mode:\n- session: steps must occur within the same session (all visitors)\n- user: steps can span multiple sessions (identified users only, requires user_id)\n", options: ["session","user"] }),
	};

	descriptor = descriptors["updateFunnel"];
}
