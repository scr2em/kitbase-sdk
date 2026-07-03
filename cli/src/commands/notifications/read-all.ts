// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class NotificationsReadAll extends ApiOperationCommand {
	static description = "Mark all notifications as read";

	descriptor = descriptors["markAllNotificationsAsRead"];
}
