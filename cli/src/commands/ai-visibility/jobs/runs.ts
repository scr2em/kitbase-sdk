// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityJobsRuns extends ApiOperationCommand {
	static description = "List a job's runs";
	static args = {
		"jobId": Args.string({ description: "AI visibility analysis job ID", required: true }),
	};
	static flags = {
		"regions": Flags.string({ description: "Regions to include. Repeat the parameter to select several; omitted or empty aggregates across every region the project runs. A region the organization is not entitled to is rejected.\n", options: ["US","EU"], multiple: true }),
	};

	descriptor = descriptors["listAiVisibilityJobRuns"];
}
