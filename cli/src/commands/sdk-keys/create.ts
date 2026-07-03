// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SdkKeysCreate extends ApiOperationCommand {
	static description = "Create a new SDK key";
	static flags = {
		"name": Flags.string({ description: "Name/description for the SDK key" }),
	};

	descriptor = descriptors["createSdkKey"];
}
