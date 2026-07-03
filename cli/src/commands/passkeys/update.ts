// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class PasskeysUpdate extends ApiOperationCommand {
	static description = "Rename a passkey";
	static args = {
		"passkeyId": Args.string({ description: "Passkey id", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "New user-friendly label" }),
	};

	descriptor = descriptors["renamePasskey"];
}
