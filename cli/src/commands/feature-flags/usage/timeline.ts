// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class FeatureFlagsUsageTimeline extends ApiOperationCommand {
	static description = "Get feature flag usage timeline";
	static flags = {
		"projectId": Flags.string({ description: "Optional project key to filter usage by a specific project. If not provided, returns organization-wide usage." }),
		"fromDate": Flags.string({ description: "Start date for the timeline period (inclusive, YYYY-MM-DD). Defaults to 30 days ago if not provided." }),
		"toDate": Flags.string({ description: "End date for the timeline period (inclusive, YYYY-MM-DD). Defaults to today if not provided." }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
	};

	descriptor = descriptors["getFeatureFlagUsageTimeline"];
}
