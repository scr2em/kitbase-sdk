// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InvitationsDelete extends ApiOperationCommand {
	static description = "Delete a pending invitation";
	static args = {
		"invitationId": Args.string({ description: "Invitation ID", required: true }),
	};

	descriptor = descriptors["deleteInvitation"];
}
