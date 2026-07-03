// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AccountUpdate extends ApiOperationCommand {
	static description = "Update current user's profile";
	static flags = {
		"firstName": Flags.string({ description: "User's first name" }),
		"lastName": Flags.string({ description: "User's last name" }),
	};

	descriptor = descriptors["updateCurrentUser"];
}
