// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class FunnelsStepsSessions extends ApiOperationCommand {
	static description = "Get sessions at a funnel step";
	static args = {
		"stepNumber": Args.string({ description: "1-based step number in the funnel", required: true }),
	};
	static flags = {
		"mode": Flags.string({ description: "- reached: sessions/users that completed this step\n- dropped: sessions/users that completed this step but NOT the next\n", options: ["reached","dropped"], required: true }),
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
		"analysisMode": Flags.string({ description: "Funnel analysis grouping mode:\n- session: steps must occur within the same session (all visitors)\n- user: steps can span multiple sessions (identified users only, requires user_id)\n", options: ["session","user"] }),
	};

	descriptor = descriptors["getFunnelStepSessions"];
}
