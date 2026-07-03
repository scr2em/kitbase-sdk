// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsList extends ApiOperationCommand {
	static description = "List AI visibility analysis jobs";
	static flags = {
		"limit": Flags.integer({  }),
	};

	descriptor = descriptors["listAiVisibilityJobs"];
}
