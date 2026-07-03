// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class BillingEntitlementsGet extends ApiOperationCommand {
	static description = "Check feature entitlement";
	static args = {
		"featureCode": Args.string({ description: "Feature code to check", required: true }),
	};

	descriptor = descriptors["checkEntitlement"];
}
