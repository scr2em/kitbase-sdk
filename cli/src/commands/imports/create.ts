// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class ImportsCreate extends ApiOperationCommand {
	static description = "Start a historical data import";
	static flags = {
		"source": Flags.string({ description: "External analytics platform an import pulls data from", options: ["ga4"] }),
		"propertyId": Flags.string({ description: "Provider-native property/site id (GA4 numeric property id)" }),
		"propertyName": Flags.string({ description: "Human-readable property name, stored for display" }),
		"startDate": Flags.string({ description: "First day to import (inclusive, property-timezone day)" }),
		"endDate": Flags.string({ description: "Last day to import (inclusive); must be before today" }),
	};

	descriptor = descriptors["startDataImport"];
}
