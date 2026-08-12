// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class WebAnalyticsDimensionTimeline extends ApiOperationCommand {
	static description = "Get project timeline data for a specific dimension value";
	static flags = {
		"dimension": Flags.string({ description: "The dimension to get timeline for", options: ["device","browser","browser_version","os","os_version","brand","model","country","region","city","utm_source","utm_medium","utm_campaign","path","entry_page","exit_page","top_page","referrer","top_referrer","outbound_link","custom_events"], required: true }),
		"value": Flags.string({ description: "The dimension value to filter by (e.g., \"Chrome\", \"US\")", required: true }),
		"preset": Flags.string({ description: "Predefined date range preset. When provided, overrides from/to parameters.", options: ["last_30_minutes","last_hour","today","yesterday","last_7_days","last_30_days","this_month","this_year"] }),
		"from": Flags.string({ description: "Start date for the analytics period (inclusive, YYYY-MM-DD). Defaults to 7 days ago." }),
		"to": Flags.string({ description: "End date for the analytics period (inclusive, YYYY-MM-DD). Defaults to today." }),
		"filters": Flags.string({ description: "Dimension filters in format dimension:operator:values.\nOperator is 'is' (include) or 'is_not' (exclude).\nValues are comma-separated. Can specify multiple filters.\nExample: filters=country:is:US,UK&filters=browser:is_not:Safari\n", multiple: true }),
		"comparePreset": Flags.string({ description: "Which earlier period the selected one is compared against. Takes precedence over compareFrom/compareTo. Omitting all three comparison parameters compares against the previous period — the same length, immediately before the selected window. There is no way to ask for no comparison.\n", options: ["previous_period","previous_week","previous_month","previous_quarter","previous_year"] }),
		"compareFrom": Flags.string({ description: "Start date of a custom comparison window (inclusive, YYYY-MM-DD), resolved in the project's reporting timezone. Must be sent together with compareTo, and is ignored when comparePreset is present. Unlike the presets, its length may differ from the selected period's. Omitted, the report compares against the previous period.\n" }),
		"compareTo": Flags.string({ description: "End date of a custom comparison window (inclusive, YYYY-MM-DD). Must be sent together with compareFrom. Omitted, the report compares against the previous period.\n" }),
	};

	descriptor = descriptors["getProjectDimensionTimeline"];
}
