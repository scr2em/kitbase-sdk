// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksCompetitorGap extends ApiOperationCommand {
	static description = "Domains linking to competitors but not to you";
	static flags = {
		"limit": Flags.integer({ description: "Maximum number of gap domains to return" }),
		"competitor": Flags.string({ description: "Narrow the list to sources linking to this one competitor domain. Must be one of the values in the response's competitors array — anything else simply matches nothing. Case-insensitive.\n" }),
	};

	descriptor = descriptors["getBacklinkCompetitorGap"];
}
