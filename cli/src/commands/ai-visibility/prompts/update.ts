// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPromptsUpdate extends ApiOperationCommand {
	static description = "Update AI visibility prompt";
	static args = {
		"promptId": Args.string({ description: "promptId", required: true }),
	};
	static flags = {
		"text": Flags.string({  }),
		"intentTier": Flags.string({ description: "Free-form intent tier ('buying' | 'category' | 'branded')" }),
		"locale": Flags.string({  }),
		"active": Flags.boolean({  }),
		"topicId": Flags.string({ description: "Topic assignment. On PUT, omitted or null clears the assignment." }),
	};

	descriptor = descriptors["updateAiVisibilityPrompt"];
}
