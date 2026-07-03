// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BillingPortal extends ApiOperationCommand {
	static description = "Create Stripe billing portal session";
	static flags = {
		"returnUrl": Flags.string({ description: "URL to redirect the user to after leaving the portal" }),
	};

	descriptor = descriptors["createBillingPortalSession"];
}
