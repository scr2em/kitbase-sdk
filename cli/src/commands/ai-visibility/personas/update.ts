// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPersonasUpdate extends ApiOperationCommand {
	static description = "Update a buyer persona";
	static args = {
		"personaId": Args.string({ description: "personaId", required: true }),
	};
	static flags = {
		"name": Flags.string({  }),
		"description": Flags.string({ description: "3-5 sentences covering this buyer's goals, pain points, and the vocabulary they would actually type. Used to seed prompt generation and to label results — never sent to an answer engine.\n" }),
	};

	descriptor = descriptors["updateAiVisibilityPersona"];
}
