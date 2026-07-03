// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPromptsSuggest extends ApiOperationCommand {
	static description = "Suggest prompts from a brand name";
	static flags = {
		"brandName": Flags.string({  }),
		"primaryDomain": Flags.string({  }),
		"count": Flags.integer({ description: "Number of prompts to suggest (1-15)" }),
	};

	descriptor = descriptors["suggestAiVisibilityPrompts"];
}
