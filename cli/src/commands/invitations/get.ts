// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InvitationsGet extends ApiOperationCommand {
	static description = "Get invitation by ID or token";
	static args = {
		"identifier": Args.string({ description: "Invitation ID or token", required: true }),
	};
	static flags = {
		"type": Flags.string({ description: "Lookup method (id or token)", options: ["id","token"] }),
	};

	descriptor = descriptors["getInvitation"];
}
