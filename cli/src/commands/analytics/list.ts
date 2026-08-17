// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AnalyticsList extends ApiOperationCommand {
	static description = "Get project analytics";
	static flags = {
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD), in the project's reporting timezone", required: true }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD), in the project's reporting timezone", required: true }),
	};

	descriptor = descriptors["getProjectAnalytics"];
}
