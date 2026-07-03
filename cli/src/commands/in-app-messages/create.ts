// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class InAppMessagesCreate extends ApiOperationCommand {
	static description = "Create in-app message";
	static flags = {
		"name": Flags.string({  }),
		"title": Flags.string({  }),
		"message": Flags.string({ description: "Markdown content" }),
		"showOnce": Flags.boolean({  }),
		"messageType": Flags.string({ options: ["modal","banner","card","image"] }),
		"isActive": Flags.boolean({  }),
		"imageUrl": Flags.string({  }),
		"actionButtonText": Flags.string({  }),
		"actionButtonUrl": Flags.string({  }),
		"secondaryButtonText": Flags.string({  }),
		"secondaryButtonUrl": Flags.string({  }),
		"backgroundColor": Flags.string({  }),
		"actionButtonColor": Flags.string({  }),
		"actionButtonTextColor": Flags.string({  }),
		"secondaryButtonColor": Flags.string({  }),
		"secondaryButtonTextColor": Flags.string({  }),
		"borderRadius": Flags.string({ options: ["none","small","medium","large"] }),
		"shadow": Flags.string({ options: ["none","small","medium","large"] }),
		"startDate": Flags.string({  }),
		"endDate": Flags.string({  }),
	};

	descriptor = descriptors["createInAppMessage"];
}
