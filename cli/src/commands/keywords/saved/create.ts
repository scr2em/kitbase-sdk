// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class KeywordsSavedCreate extends ApiOperationCommand {
	static description = "Save keywords to the project";
	static flags = {
		"locationCode": Flags.integer({ description: "Market to save them for; defaults to the project's own" }),
		"languageCode": Flags.string({  }),
		"tagMode": Flags.string({ description: "`append` adds the given tags; `replace` removes every existing tag from the affected keywords first.\n", options: ["append","replace"] }),
	};

	descriptor = descriptors["saveKeywords"];
}
