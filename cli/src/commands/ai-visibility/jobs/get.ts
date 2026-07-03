// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsGet extends ApiOperationCommand {
	static description = "Get AI visibility job with live progress";
	static args = {
		"jobId": Args.string({ description: "AI visibility analysis job ID", required: true }),
	};

	descriptor = descriptors["getAiVisibilityJob"];
}
