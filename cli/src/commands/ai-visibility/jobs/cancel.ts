// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsCancel extends ApiOperationCommand {
	static description = "Cancel an active job";
	static args = {
		"jobId": Args.string({ description: "AI visibility analysis job ID", required: true }),
	};

	descriptor = descriptors["cancelAiVisibilityJob"];
}
