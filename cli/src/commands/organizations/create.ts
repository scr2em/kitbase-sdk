// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class OrganizationsCreate extends ApiOperationCommand {
	static description = "Create a new organization";
	static flags = {
		"name": Flags.string({ description: "Organization name" }),
		"orgSlug": Flags.string({ description: "Organization slug (unique identifier used in URLs)" }),
		"description": Flags.string({ description: "Organization description" }),
		"logoUrl": Flags.string({ description: "URL to the organization logo image" }),
	};

	descriptor = descriptors["createOrganization"];
}
