// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SessionsGet extends ApiOperationCommand {
	static description = "Get session detail";
	static args = {
		"sessionId": Args.string({ description: "Session identifier", required: true }),
	};

	descriptor = descriptors["getSessionDetail"];
}
