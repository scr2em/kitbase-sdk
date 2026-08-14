// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityExplorationsGet extends ApiOperationCommand {
	static description = "One exploration with every answer";
	static args = {
		"explorationId": Args.string({ description: "explorationId", required: true }),
	};

	descriptor = descriptors["getAiVisibilityExploration"];
}
