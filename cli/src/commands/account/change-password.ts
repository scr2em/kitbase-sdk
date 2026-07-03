// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AccountChangePassword extends ApiOperationCommand {
	static description = "Change current user's password";
	static flags = {
		"currentPassword": Flags.string({ description: "Current password. Required if the user has a password. Can be omitted for OAuth-only users." }),
		"newPassword": Flags.string({ description: "New password (min 8 chars, must contain uppercase, lowercase, number, and special character)" }),
	};

	descriptor = descriptors["changePassword"];
}
