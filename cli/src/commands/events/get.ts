// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class EventsGet extends ApiOperationCommand {
	static description = "Get event details";
	static args = {
		"eventId": Args.string({ description: "Event ID", required: true }),
	};

	descriptor = descriptors["getEvent"];
}
