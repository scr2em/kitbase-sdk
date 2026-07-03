// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InAppMessagesList extends ApiOperationCommand {
	static description = "List in-app messages";
	static flags = {
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
		"sort": Flags.string({ options: ["asc","desc"] }),
	};

	descriptor = descriptors["listInAppMessages"];
}
