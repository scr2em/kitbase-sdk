// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InvitationsCreate extends ApiOperationCommand {
	static description = "Send invitation";
	static flags = {
		"email": Flags.string({ description: "Email of the invited user" }),
		"role": Flags.string({ description: "Role Id" }),
	};

	descriptor = descriptors["sendInvitation"];
}
