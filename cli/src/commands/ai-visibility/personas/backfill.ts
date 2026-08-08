// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPersonasBackfill extends ApiOperationCommand {
	static description = "Apply current persona assignments to legacy runs";
	static flags = {
		"dryRun": Flags.boolean({  }),
	};

	descriptor = descriptors["backfillAiVisibilityPersonas"];
}
