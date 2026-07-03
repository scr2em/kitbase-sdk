// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TwoFactorEnable extends ApiOperationCommand {
	static description = "Enable 2FA after setup";
	static flags = {
		"code": Flags.string({ description: "The 6-digit TOTP code from authenticator app" }),
	};

	descriptor = descriptors["enableTwoFactor"];
}
