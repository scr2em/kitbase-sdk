// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class SiteContentRounds extends ApiOperationCommand {
	static description = "List analysis rounds";

	descriptor = descriptors["listSiteContentRounds"];
}
