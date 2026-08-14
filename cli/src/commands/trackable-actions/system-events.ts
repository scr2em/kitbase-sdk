// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsSystemEvents extends ApiOperationCommand {
	static description = "Things in this window that nobody's customer did";
	static flags = {
		"from": Flags.string({ required: true }),
		"to": Flags.string({ required: true }),
	};

	descriptor = descriptors["listTrackableActionSystemEvents"];
}
