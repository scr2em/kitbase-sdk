// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentPagesAiAnalysis extends ApiOperationCommand {
	static description = "Have AI read one page as a marketer would";
	static flags = {
		"path": Flags.string({ required: true }),
	};

	descriptor = descriptors["analyzeSiteContentPageWithAi"];
}
