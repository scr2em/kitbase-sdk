// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BillingCheckout extends ApiOperationCommand {
	static description = "Create Stripe checkout session";
	static flags = {
		"planId": Flags.string({ description: "ID of the plan to upgrade to" }),
	};

	descriptor = descriptors["createCheckoutSession"];
}
