// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityBrandsCreate extends ApiOperationCommand {
	static description = "Create AI visibility brand";
	static flags = {
		"name": Flags.string({ description: "Brand display name (always matched as an alias)" }),
		"primaryDomain": Flags.string({ description: "Registrable domain (eTLD+1), e.g. \"example.com\" — drives SELF/COMPETITOR citation classification" }),
		"isSelf": Flags.boolean({ description: "TRUE for the customer's own brand (one per project); FALSE for a competitor" }),
		"active": Flags.boolean({  }),
	};

	descriptor = descriptors["createAiVisibilityBrand"];
}
