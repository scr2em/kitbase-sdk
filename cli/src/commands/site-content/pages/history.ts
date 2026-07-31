// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentPagesHistory extends ApiOperationCommand {
	static description = "One page across analysis rounds";
	static flags = {
		"path": Flags.string({ description: "The indexed page's path", required: true }),
	};

	descriptor = descriptors["getSiteContentPageHistory"];
}
