// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SdkKeysList extends ApiOperationCommand {
	static description = "Get SDK keys with pagination and sorting";
	static flags = {
		"page": Flags.integer({ description: "Page number (default 0)" }),
		"size": Flags.integer({ description: "Page size (default 20)" }),
		"sort": Flags.string({ description: "Sort direction by createdAt (default desc)", options: ["asc","desc"] }),
	};

	descriptor = descriptors["getSdkKeys"];
}
