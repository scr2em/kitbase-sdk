// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class EventsAnalyticsBreakdown extends ApiOperationCommand {
	static description = "Get events breakdown by dimension";
	static flags = {
		"dimension": Flags.string({ description: "Dimension to group events by", options: ["event_name","user","country","region","city","browser","browser_version","os","os_version","device","brand","model","utm_source","utm_medium","utm_campaign"], required: true }),
		"from": Flags.string({ description: "Start date filter (inclusive, YYYY-MM-DD)" }),
		"to": Flags.string({ description: "End date filter (inclusive, YYYY-MM-DD)" }),
		"limit": Flags.integer({ description: "Maximum number of results to return" }),
	};

	descriptor = descriptors["getEventsAnalyticsBreakdown"];
}
