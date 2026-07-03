// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class DashboardEventsTimeline extends ApiOperationCommand {
	static description = "Get flexible events timeline for dashboard";
	static flags = {
		"range": Flags.string({ description: "Time range preset. Controls both the time window and the date-truncation granularity.\nSupported values: \"30m\" (minute), \"24h\" (hour), \"7d\" (day), \"30d\" (day), \"3m\" (week), \"12m\" (month).\nDefaults to \"24h\".\n", options: ["30m","24h","7d","30d","3m","12m"] }),
	};

	descriptor = descriptors["getDashboardEventsTimeline"];
}
