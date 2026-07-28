// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityTopicsCreate extends ApiOperationCommand {
	static description = "Create a prompt topic";
	static flags = {
		"name": Flags.string({  }),
	};

	descriptor = descriptors["createAiVisibilityTopic"];
}
