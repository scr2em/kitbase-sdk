// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AgentConversations extends ApiOperationCommand {
	static description = "Delete every conversation in this scope";
	static flags = {
		"workflowId": Flags.string({ description: "Scopes the clear to one workflow's shared conversation." }),
	};

	descriptor = descriptors["deleteAllProjectAgentConversations"];
}
