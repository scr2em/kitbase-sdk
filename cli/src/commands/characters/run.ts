// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class CharactersRun extends ApiOperationCommand {
	static description = "Have a character read something now";
	static args = {
		"characterId": Args.string({ description: "characterId", required: true }),
	};
	static flags = {
		"path": Flags.string({ description: "An indexed page for the character to read." }),
		"task": Flags.string({ description: "What to ask it. Left out, it reviews the page and reports what matters." }),
	};

	descriptor = descriptors["runAgentCharacter"];
}
