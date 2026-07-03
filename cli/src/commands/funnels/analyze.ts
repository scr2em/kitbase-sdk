// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class FunnelsAnalyze extends ApiOperationCommand {
	static description = "Analyze a funnel";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC. Defaults to UTC if omitted." }),
		"analysisMode": Flags.string({ description: "Funnel analysis grouping mode:\n- session: steps must occur within the same session (all visitors)\n- user: steps can span multiple sessions (identified users only, requires user_id)\n", options: ["session","user"] }),
	};

	descriptor = descriptors["analyzeFunnel"];
}
