// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class WebAnalyticsCompare extends ApiOperationCommand {
	static description = "Compare web analytics between two periods";
	static flags = {
		"dimension": Flags.string({ description: "The dimension to compare", options: ["device","browser","browser_version","os","os_version","brand","model","country","region","city","utm_source","utm_medium","utm_campaign","path","entry_page","exit_page","top_page","referrer","top_referrer","outbound_link","custom_events"], required: true }),
		"currentFrom": Flags.string({ description: "Start date of the current period (inclusive, YYYY-MM-DD)", required: true }),
		"currentTo": Flags.string({ description: "End date of the current period (inclusive, YYYY-MM-DD)", required: true }),
		"previousFrom": Flags.string({ description: "Start date of the previous period (inclusive, YYYY-MM-DD)", required: true }),
		"previousTo": Flags.string({ description: "End date of the previous period (inclusive, YYYY-MM-DD)", required: true }),
		"timezone": Flags.string({ description: "Client timezone (e.g. \"Africa/Cairo\", \"America/New_York\"). Used to convert date boundaries to UTC. Defaults to UTC." }),
		"limit": Flags.integer({ description: "Maximum number of results to return (default 10)" }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n" }),
	};

	descriptor = descriptors["compareWebAnalyticsPeriods"];
}
