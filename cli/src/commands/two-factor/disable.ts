// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TwoFactorDisable extends ApiOperationCommand {
	static description = "Disable 2FA";
	static flags = {
		"password": Flags.string({ description: "Current account password for verification" }),
		"code": Flags.string({ description: "Current TOTP code or backup code" }),
	};

	descriptor = descriptors["disableTwoFactor"];
}
