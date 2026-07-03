// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsResume extends ApiOperationCommand {
	static description = "Resume a paused job";
	static args = {
		"jobId": Args.string({ description: "AI visibility analysis job ID", required: true }),
	};

	descriptor = descriptors["resumeAiVisibilityJob"];
}
