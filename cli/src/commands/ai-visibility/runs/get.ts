// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityRunsGet extends ApiOperationCommand {
	static description = "Run drill-down";
	static args = {
		"runId": Args.string({ description: "runId", required: true }),
	};

	descriptor = descriptors["getAiVisibilityRun"];
}
