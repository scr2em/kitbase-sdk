// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AiVisibilityRegions extends ApiOperationCommand {
	static description = "Regions this project is measured from";

	descriptor = descriptors["getAiVisibilityRegions"];
}
