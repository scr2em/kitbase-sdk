// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPromptsBulkMove extends ApiOperationCommand {
	static description = "Move AI visibility prompts to a topic (bulk)";
	static flags = {
		"topicId": Flags.string({ description: "Topic to move every listed prompt into. Omitted or null moves them out of whatever topic they are in. There is no \"leave the topic alone\" case — setting the topic is the entire operation, which is why null can mean unassign here without ambiguity." }),
	};

	descriptor = descriptors["bulkMoveAiVisibilityPrompts"];
}
