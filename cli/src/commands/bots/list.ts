// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BotsList extends ApiOperationCommand {
	static description = "List bot/crawler requests";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone. Used to convert date boundaries to UTC. Defaults to UTC if omitted." }),
		"search": Flags.string({ description: "Search by bot name, vendor, or path (partial match)" }),
		"actorType": Flags.string({ description: "Filter by actor type (verified_bot, spoofed_bot, suspected_bot)" }),
		"page": Flags.integer({ description: "Page number (0-based)" }),
		"size": Flags.integer({ description: "Items per page" }),
	};

	descriptor = descriptors["listBots"];
}
