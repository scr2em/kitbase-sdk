// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InvitationsUpdate extends ApiOperationCommand {
	static description = "Update invitation role";
	static args = {
		"invitationId": Args.string({ description: "Invitation ID", required: true }),
	};
	static flags = {
		"role": Flags.string({ description: "New role id" }),
	};

	descriptor = descriptors["updateInvitation"];
}
