// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class TrackableActionsUpdate extends ApiOperationCommand {
	static description = "Update a trackable action";
	static args = {
		"actionId": Args.string({ description: "actionId", required: true }),
	};
	static flags = {
		"description": Flags.string({  }),
		"verb": Flags.string({ description: "What kind of thing was done. Four verbs cover everything customers track; the platform it was done on is a separate field, so \"published a podcast / an app / an extension\" is one verb rather than three.", options: ["PUBLISHED","CHANGED_ACCESS","RAN_CAMPAIGN","CHANGED_IDENTITY"] }),
		"platform": Flags.string({  }),
		"targetUrl": Flags.string({ description: "Omit to keep the stored URL; send an empty string to clear it." }),
		"scope": Flags.string({ description: "What the action touched, which is what decides how much of it can be measured. PAGE and EXTERNAL both require a URL and differ only by whose domain it is on; SITEWIDE and NONE both forbid one.", options: ["PAGE","SITEWIDE","EXTERNAL","NONE"] }),
		"startedOn": Flags.string({  }),
		"endedOn": Flags.string({ description: "Omit to keep the stored value. Cannot be cleared." }),
		"confirmed": Flags.boolean({ description: "Promotes a detected candidate into a tracked action. Setting it true also clears any dismissal." }),
		"dismissed": Flags.boolean({ description: "Refuses a detected candidate. The row is kept rather than deleted, so a later sweep does not propose the same page again — a suggestion you have already refused coming back daily is how an inbox stops being read." }),
	};

	descriptor = descriptors["updateTrackableAction"];
}
