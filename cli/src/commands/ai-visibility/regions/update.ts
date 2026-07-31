// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityRegionsUpdate extends ApiOperationCommand {
	static description = "Set the regions this project runs";

	descriptor = descriptors["updateAiVisibilityRegions"];
}
