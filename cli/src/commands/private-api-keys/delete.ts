// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class PrivateApiKeysDelete extends ApiOperationCommand {
	static description = "Delete a private API key";
	static args = {
		"keyId": Args.string({ description: "Private API key ID", required: true }),
	};

	descriptor = descriptors["deletePrivateApiKey"];
}
