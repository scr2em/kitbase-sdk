// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class NotificationsRead extends ApiOperationCommand {
	static description = "Mark notification as read";
	static args = {
		"notificationId": Args.string({ description: "Notification ID", required: true }),
	};

	descriptor = descriptors["markNotificationAsRead"];
}
