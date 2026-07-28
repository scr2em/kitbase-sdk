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
		"type": Flags.string({ description: "Only return notifications of these types (comma-separated). Omit for all types. unreadCount is always the unfiltered total, so a filtered page never changes the badge.\n", options: ["invitation_received","build_completed","member_joined","member_removed","log_rate_exceeded","role_updated","data_retention_cleanup","data_retention_warning","admin_broadcast","backlink_detected","payment_failed","export_completed","workflow_report","workflow_approval_requested","marketplace_order_paid","marketplace_order_published","marketplace_order_revision_requested","marketplace_order_rejected","marketplace_order_link_lost","marketplace_order_refunded"], multiple: true }),
	};

	descriptor = descriptors["getNotifications"];
}
