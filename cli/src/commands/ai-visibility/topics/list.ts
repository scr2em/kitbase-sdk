// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityTopicsList extends ApiOperationCommand {
	static description = "List prompt topics";
	static flags = {
		"includeArchived": Flags.boolean({  }),
	};

	descriptor = descriptors["listAiVisibilityTopics"];
}
