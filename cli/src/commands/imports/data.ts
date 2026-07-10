// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class ImportsData extends ApiOperationCommand {
	static description = "Delete an import's imported data";
	static args = {
		"importId": Args.string({ description: "Data import ID", required: true }),
	};

	descriptor = descriptors["deleteDataImportData"];
}
