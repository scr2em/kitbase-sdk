// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityBrandsDelete extends ApiOperationCommand {
	static description = "Delete AI visibility brand";
	static args = {
		"brandId": Args.string({ description: "brandId", required: true }),
	};

	descriptor = descriptors["deleteAiVisibilityBrand"];
}
