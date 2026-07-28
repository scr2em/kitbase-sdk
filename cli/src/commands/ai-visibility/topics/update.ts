// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityTopicsUpdate extends ApiOperationCommand {
	static description = "Rename a prompt topic";
	static args = {
		"topicId": Args.string({ description: "topicId", required: true }),
	};
	static flags = {
		"name": Flags.string({  }),
	};

	descriptor = descriptors["updateAiVisibilityTopic"];
}
