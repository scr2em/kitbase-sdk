// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsCreate extends ApiOperationCommand {
	static description = "Log a trackable action";
	static flags = {
		"description": Flags.string({  }),
		"verb": Flags.string({ description: "What kind of thing was done. Four verbs cover everything customers track; the platform it was done on is a separate field, so \"published a podcast / an app / an extension\" is one verb rather than three.", options: ["PUBLISHED","CHANGED_ACCESS","RAN_CAMPAIGN","CHANGED_IDENTITY"] }),
		"platform": Flags.string({  }),
		"targetUrl": Flags.string({ description: "Required for PAGE and EXTERNAL, rejected for SITEWIDE and NONE. A PAGE URL must sit on the project's own website domain and an EXTERNAL one must not — that check is what makes the measurability we report back honest." }),
		"scope": Flags.string({ description: "What the action touched, which is what decides how much of it can be measured. PAGE and EXTERNAL both require a URL and differ only by whose domain it is on; SITEWIDE and NONE both forbid one.", options: ["PAGE","SITEWIDE","EXTERNAL","NONE"] }),
		"startedOn": Flags.string({  }),
		"endedOn": Flags.string({ description: "Must not precede startedOn." }),
	};

	descriptor = descriptors["createTrackableAction"];
}
