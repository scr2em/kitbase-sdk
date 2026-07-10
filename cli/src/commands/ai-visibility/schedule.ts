// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AiVisibilitySchedule extends ApiOperationCommand {
	static description = "Automatic analysis schedule and time until the next run";

	descriptor = descriptors["getAiVisibilitySchedule"];
}
