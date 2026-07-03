// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FeedbackCreate extends ApiOperationCommand {
	static description = "Submit feedback";
	static flags = {
		"message": Flags.string({ description: "The feedback message content" }),
		"page": Flags.string({ description: "The page (route/path) the user was on when submitting feedback" }),
	};

	descriptor = descriptors["submitFeedback"];
}
