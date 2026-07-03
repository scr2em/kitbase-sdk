// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class MembersUpdate extends ApiOperationCommand {
	static description = "Update member role";
	static args = {
		"membershipId": Args.string({ description: "Membership ID", required: true }),
	};
	static flags = {
		"roleId": Flags.string({ description: "New role ID" }),
	};

	descriptor = descriptors["updateMemberRole"];
}
