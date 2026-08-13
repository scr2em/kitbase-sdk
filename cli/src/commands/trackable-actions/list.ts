// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsList extends ApiOperationCommand {
	static description = "List trackable actions";
	static flags = {
		"verb": Flags.string({ options: ["PUBLISHED","CHANGED_ACCESS","RAN_CAMPAIGN","CHANGED_IDENTITY"] }),
		"platform": Flags.string({  }),
		"q": Flags.string({ description: "Free-text match against the description." }),
		"from": Flags.string({ description: "Only actions that started on or after this date." }),
		"to": Flags.string({ description: "Only actions that started on or before this date." }),
		"page": Flags.integer({  }),
		"size": Flags.integer({  }),
	};

	descriptor = descriptors["listTrackableActions"];
}
