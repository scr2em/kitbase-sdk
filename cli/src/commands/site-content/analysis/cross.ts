// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteContentAnalysisCross extends ApiOperationCommand {
	static description = "Read every page's positioning together";

	descriptor = descriptors["runSiteContentCrossAnalysis"];
}
