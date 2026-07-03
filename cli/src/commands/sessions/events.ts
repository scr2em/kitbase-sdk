// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SessionsEvents extends ApiOperationCommand {
	static description = "List session events";
	static args = {
		"sessionId": Args.string({ description: "Session identifier", required: true }),
	};
	static flags = {
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
	};

	descriptor = descriptors["getSessionEvents"];
}
