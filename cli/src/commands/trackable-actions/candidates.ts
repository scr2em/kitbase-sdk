// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsCandidates extends ApiOperationCommand {
	static description = "Pages the crawl noticed that nobody logged";
	static flags = {
		"limit": Flags.integer({  }),
	};

	descriptor = descriptors["listTrackableActionCandidates"];
}
