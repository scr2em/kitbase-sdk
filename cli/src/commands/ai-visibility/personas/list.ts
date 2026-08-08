// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPersonasList extends ApiOperationCommand {
	static description = "List buyer personas";
	static flags = {
		"includeArchived": Flags.boolean({  }),
	};

	descriptor = descriptors["listAiVisibilityPersonas"];
}
