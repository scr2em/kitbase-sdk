// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../../runtime/operation-command.js";
import { descriptors } from "../../../../generated/descriptors.js";

export default class SiteContentSpecDocsList extends ApiOperationCommand {
	static description = "List the planning documents this site is graded against";

	descriptor = descriptors["listSpecDocs"];
}
