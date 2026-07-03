// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class PasskeysDelete extends ApiOperationCommand {
	static description = "Delete a passkey";
	static args = {
		"passkeyId": Args.string({ description: "Passkey id", required: true }),
	};

	descriptor = descriptors["deletePasskey"];
}
