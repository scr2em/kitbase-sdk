// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentSpecRules extends ApiOperationCommand {
	static description = "List the rules read from the planning documents";
	static flags = {
		"status": Flags.string({ description: "Omit for all", options: ["EXTRACTED","APPROVED","REJECTED"] }),
	};

	descriptor = descriptors["listSpecRules"];
}
