// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class AiVisibilityExplorationsCreate extends ApiOperationCommand {
	static description = "Ask one question across several engines";
	static flags = {
		"promptText": Flags.string({ description: "The question to ask, verbatim. Same limit as a tracked prompt." }),
		"analyze": Flags.boolean({ description: "Run the brand extractor over each answer to detect tracked-brand mentions. Costs one extra LLM call per engine that has no reusable current-version analysis.\n" }),
		"highlightBrand": Flags.string({ description: "An arbitrary brand name to look for in every answer and citation, matched deterministically in code with no LLM involved. Independent of `analyze` and of the project's configured brands — this is how you check a name you do not track.\n" }),
		"runFresh": Flags.boolean({ description: "Bypass the 7-day answer cache and pay every selected engine again. Off by default: an identical question asked from the same vantage point reuses the stored answer for free.\n" }),
	};

	descriptor = descriptors["createAiVisibilityExploration"];
}
