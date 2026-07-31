// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityRegionsList extends ApiOperationCommand {
	static description = "Regions available to this organization and selected by this project";

	descriptor = descriptors["getAiVisibilityRegions"];
}
