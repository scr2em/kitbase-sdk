// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class OrganizationsCurrentUpdate extends ApiOperationCommand {
	static description = "Update organization";
	static flags = {
		"name": Flags.string({ description: "Organization name" }),
		"logoUrl": Flags.string({ description: "URL to the organization logo image" }),
		"require2fa": Flags.boolean({ description: "Whether this organization requires members to have 2FA enabled" }),
		"dataRetentionNotificationsEnabled": Flags.boolean({ description: "Whether this organization receives data retention emails and in-app notifications" }),
	};

	descriptor = descriptors["updateOrganization"];
}
