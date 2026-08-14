// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityExplorationsDelete extends ApiOperationCommand {
	static description = "Remove an exploration from history";
	static args = {
		"explorationId": Args.string({ description: "explorationId", required: true }),
	};

	descriptor = descriptors["deleteAiVisibilityExploration"];
}
