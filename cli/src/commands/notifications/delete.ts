// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class NotificationsDelete extends ApiOperationCommand {
	static description = "Delete a notification";
	static args = {
		"notificationId": Args.string({ description: "Notification ID", required: true }),
	};

	descriptor = descriptors["deleteNotification"];
}
