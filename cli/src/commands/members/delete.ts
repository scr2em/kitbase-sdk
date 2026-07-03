// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class MembersDelete extends ApiOperationCommand {
	static description = "Remove member";
	static args = {
		"membershipId": Args.string({ description: "Membership ID", required: true }),
	};

	descriptor = descriptors["removeMember"];
}
