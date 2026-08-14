// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class AiVisibilityExplorationProviders extends ApiOperationCommand {
	static description = "Engines Prompt Explorer can run right now";

	descriptor = descriptors["getAiVisibilityExplorationProviders"];
}
