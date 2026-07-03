// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebAnalyticsBreakdown extends ApiOperationCommand {
	static description = "Get project analytics breakdown by dimension";
	static flags = {
		"dimension": Flags.string({ description: "The dimension to get breakdown for", options: ["device","browser","browser_version","os","os_version","brand","model","country","region","city","utm_source","utm_medium","utm_campaign","path","entry_page","exit_page","top_page","referrer","top_referrer","outbound_link","custom_events"], required: true }),
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date for the analytics period (inclusive, YYYY-MM-DD). Defaults to 7 days ago." }),
		"to": Flags.string({ description: "End date for the analytics period (inclusive, YYYY-MM-DD). Defaults to today." }),
		"page": Flags.integer({ description: "Page number (0-indexed, default 0)" }),
		"size": Flags.integer({ description: "Number of results per page (default 10)" }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n" }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC.", required: true }),
	};

	descriptor = descriptors["getProjectAnalyticsBreakdown"];
}
