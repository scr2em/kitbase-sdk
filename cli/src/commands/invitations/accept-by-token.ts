// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InvitationsAcceptByToken extends ApiOperationCommand {
	static description = "Accept invitation by token";
	static args = {
		"token": Args.string({ description: "Invitation token from email", required: true }),
	};

	descriptor = descriptors["acceptInvitationByToken"];
}
