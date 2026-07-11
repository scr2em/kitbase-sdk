// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class ProjectsUpdate extends ApiOperationCommand {
	static description = "Update project";
	static args = {
		"projectId": Args.string({ description: "Project key identifier", required: true }),
	};
	static flags = {
		"name": Flags.string({ description: "Project name" }),
		"description": Flags.string({ description: "Project description" }),
		"websiteDomain": Flags.string({ description: "The project's public website domain (registrable eTLD+1). Send a non-empty value to set it (normalized on write; invalid input rejected with 400), an empty string to clear it, or omit the field entirely to leave the current value unchanged." }),
	};

	descriptor = descriptors["updateProject"];
}
