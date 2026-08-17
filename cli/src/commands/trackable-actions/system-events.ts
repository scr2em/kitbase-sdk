// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsSystemEvents extends ApiOperationCommand {
	static description = "Things in this window that nobody's customer did";
	static flags = {
		"preset": Flags.string({ description: "Predefined date range preset, resolved in the project's reporting timezone. Takes precedence over from/to.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD). Used when preset is not provided; send with `to`." }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD). Used when preset is not provided; send with `from`." }),
	};

	descriptor = descriptors["listTrackableActionSystemEvents"];
}
