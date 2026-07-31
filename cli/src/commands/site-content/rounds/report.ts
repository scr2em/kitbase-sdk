// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentRoundsReport extends ApiOperationCommand {
	static description = "The whole record of one crawl";
	static args = {
		"roundId": Args.string({ description: "roundId", required: true }),
	};

	descriptor = descriptors["getSiteContentReport"];
}
