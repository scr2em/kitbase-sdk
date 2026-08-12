// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPromptsBulkAssignPersona extends ApiOperationCommand {
	static description = "Assign a persona to AI visibility prompts (bulk)";
	static flags = {
		"personaId": Flags.string({ description: "Persona to assign to every listed prompt. Omitted or null unassigns them. As with the topic, setting the persona is the entire operation — the call never touches a prompt's topic or text." }),
	};

	descriptor = descriptors["bulkAssignAiVisibilityPromptPersona"];
}
