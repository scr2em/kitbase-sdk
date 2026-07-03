// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AccountGet extends ApiOperationCommand {
	static description = "Get current user info with role and permissions for the specified organization";

	descriptor = descriptors["getCurrentUserWithOrgContext"];
}
