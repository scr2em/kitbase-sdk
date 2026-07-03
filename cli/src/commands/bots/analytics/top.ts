// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class BotsAnalyticsTop extends ApiOperationCommand {
	static description = "Get top bots/crawlers by request count";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD). Used when preset is not provided." }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\"). Used to convert date boundaries to UTC." }),
		"size": Flags.integer({ description: "Maximum number of top bots to return" }),
	};

	descriptor = descriptors["getBotsAnalyticsTopBots"];
}
