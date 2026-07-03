// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class ProjectsDelete extends ApiOperationCommand {
	static description = "Delete project";
	static args = {
		"projectId": Args.string({ description: "Project key identifier", required: true }),
	};

	descriptor = descriptors["deleteProject"];
}
