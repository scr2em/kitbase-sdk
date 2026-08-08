// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityPersonasSuggest extends ApiOperationCommand {
	static description = "Draft candidate buyer personas";
	static flags = {
		"brandName": Flags.string({  }),
		"primaryDomain": Flags.string({  }),
	};

	descriptor = descriptors["suggestAiVisibilityPersonas"];
}
