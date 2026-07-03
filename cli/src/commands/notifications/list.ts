// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class NotificationsList extends ApiOperationCommand {
	static description = "Get user notifications";
	static flags = {
		"page": Flags.integer({ description: "Page number (0-indexed)" }),
		"size": Flags.integer({ description: "Page size" }),
		"unreadOnly": Flags.boolean({ description: "If true, only return unread notifications" }),
	};

	descriptor = descriptors["getNotifications"];
}
