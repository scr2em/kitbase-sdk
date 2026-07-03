// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BillingCancelSubscription extends ApiOperationCommand {
	static description = "Cancel subscription";

	descriptor = descriptors["cancelSubscription"];
}
