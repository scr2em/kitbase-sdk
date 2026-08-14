// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class KeywordsSerp extends ApiOperationCommand {
	static description = "Inspect the organic SERP for a keyword";
	static flags = {
		"keyword": Flags.string({  }),
		"locationCode": Flags.integer({  }),
		"languageCode": Flags.string({  }),
	};

	descriptor = descriptors["getKeywordSerp"];
}
