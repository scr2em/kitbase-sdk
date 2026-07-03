// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SdkKeysDelete extends ApiOperationCommand {
	static description = "Delete an SDK key";
	static args = {
		"keyId": Args.string({ description: "SDK key ID", required: true }),
	};

	descriptor = descriptors["deleteSdkKey"];
}
