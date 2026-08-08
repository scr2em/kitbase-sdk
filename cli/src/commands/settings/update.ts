// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SettingsUpdate extends ApiOperationCommand {
	static description = "Update project settings";
	static flags = {
		"eventsEnabled": Flags.boolean({  }),
		"ipLoggingEnabled": Flags.boolean({  }),
		"botDetectionEnabled": Flags.boolean({  }),
		"autoTrackPageViews": Flags.boolean({  }),
		"autoTrackOutboundLinks": Flags.boolean({  }),
		"autoTrackClicks": Flags.boolean({  }),
		"autoTrackScrollDepth": Flags.boolean({  }),
		"autoTrackVisibility": Flags.boolean({  }),
		"reportingTimezone": Flags.string({ description: "IANA timezone id, e.g. \"Africa/Cairo\" or \"UTC\". Rejected with VAL_001 if it is not a zone the server knows." }),
	};

	descriptor = descriptors["updateProjectSettings"];
}
