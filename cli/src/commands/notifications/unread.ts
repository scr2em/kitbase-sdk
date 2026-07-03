// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class NotificationsUnread extends ApiOperationCommand {
	static description = "Mark notification as unread";
	static args = {
		"notificationId": Args.string({ description: "Notification ID", required: true }),
	};

	descriptor = descriptors["markNotificationAsUnread"];
}
