// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class RolesList extends ApiOperationCommand {
	static description = "List available roles";

	descriptor = descriptors["listRoles"];
}
