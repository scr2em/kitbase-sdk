// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class DashboardEventsByProject extends ApiOperationCommand {
	static description = "Get events breakdown by project";

	descriptor = descriptors["getDashboardEventsByProject"];
}
