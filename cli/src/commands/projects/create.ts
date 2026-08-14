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
		"keywordLocationCode": Flags.integer({ description: "Default keyword research market (a DataForSEO location code from GET /{orgSlug}/keyword-markets). Omit to leave the project on 2840 (United States). An unsupported code is rejected with 400." }),
		"keywordLanguageCode": Flags.string({ description: "Language paired with keywordLocationCode. Omit to use that market's default language. A language DataForSEO does not serve in that country is rejected with 400 — the provider bills such a task before failing it." }),
	};

	descriptor = descriptors["createProject"];
}
