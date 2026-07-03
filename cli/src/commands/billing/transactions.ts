// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BillingTransactions extends ApiOperationCommand {
	static description = "List billing transactions";
	static flags = {
		"limit": Flags.integer({ description: "Number of transactions per page" }),
		"startingAfter": Flags.string({ description: "Cursor for pagination (last invoice ID from previous page)" }),
		"status": Flags.string({ description: "Filter by invoice status", options: ["paid","open","draft","uncollectible","void"] }),
	};

	descriptor = descriptors["getBillingTransactions"];
}
