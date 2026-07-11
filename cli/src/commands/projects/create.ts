// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class ProjectsCreate extends ApiOperationCommand {
	static description = "Create project";
	static flags = {
		"name": Flags.string({ description: "Project name" }),
		"description": Flags.string({ description: "Project description" }),
		"projectType": Flags.string({ description: "The framework or technology type of the project", options: ["react","nextjs","vue","angular","svelte","nuxt","nodejs","python","go","java","rust","dotnet","others"] }),
		"websiteDomain": Flags.string({ description: "Optional public website domain for the project (registrable eTLD+1). Normalized on write (scheme/www/path stripped); invalid input is rejected with 400. Omit or leave empty for projects with no public website (apps, dashboards)." }),
	};

	descriptor = descriptors["createProject"];
}
