// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class JourneysAnalyze extends ApiOperationCommand {
	static description = "Analyze user journeys";
	static flags = {
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC. Defaults to UTC if omitted." }),
		"steps": Flags.integer({ description: "Maximum number of steps per journey path" }),
		"limit": Flags.integer({ description: "Maximum number of journey paths to return" }),
	};

	descriptor = descriptors["analyzeJourney"];
}
