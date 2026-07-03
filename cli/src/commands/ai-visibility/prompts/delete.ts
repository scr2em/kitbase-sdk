// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPromptsDelete extends ApiOperationCommand {
	static description = "Deactivate AI visibility prompt";
	static args = {
		"promptId": Args.string({ description: "promptId", required: true }),
	};

	descriptor = descriptors["deleteAiVisibilityPrompt"];
}
