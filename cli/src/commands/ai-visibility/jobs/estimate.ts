// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsEstimate extends ApiOperationCommand {
	static description = "Estimate cost of an analysis run";

	descriptor = descriptors["getAiVisibilityJobEstimate"];
}
