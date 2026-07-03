// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityBrandsList extends ApiOperationCommand {
	static description = "List AI visibility brands";

	descriptor = descriptors["listAiVisibilityBrands"];
}
