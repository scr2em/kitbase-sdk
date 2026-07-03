// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FunnelsList extends ApiOperationCommand {
	static description = "List saved funnels";
	static flags = {
		"search": Flags.string({ description: "Optional search term to filter funnels by name (case-insensitive)" }),
	};

	descriptor = descriptors["listFunnels"];
}
