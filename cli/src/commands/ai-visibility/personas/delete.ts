// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPersonasDelete extends ApiOperationCommand {
	static description = "Archive a buyer persona";
	static args = {
		"personaId": Args.string({ description: "personaId", required: true }),
	};

	descriptor = descriptors["deleteAiVisibilityPersona"];
}
