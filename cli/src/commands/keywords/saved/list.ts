// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class KeywordsSavedList extends ApiOperationCommand {
	static description = "List saved keywords";
	static flags = {
		"page": Flags.integer({ description: "Zero-based page index" }),
		"size": Flags.integer({  }),
		"q": Flags.string({ description: "Substring match on the keyword" }),
		"include": Flags.string({ description: "Keep only keywords containing every one of these terms", multiple: true }),
		"exclude": Flags.string({ description: "Drop keywords containing any of these terms", multiple: true }),
		"minVolume": Flags.integer({  }),
		"maxVolume": Flags.integer({  }),
		"minCpc": Flags.integer({  }),
		"maxCpc": Flags.integer({  }),
		"minDifficulty": Flags.integer({  }),
		"maxDifficulty": Flags.integer({  }),
		"tagIds": Flags.string({ description: "Keep keywords carrying any of these tags", multiple: true }),
		"sort": Flags.string({ options: ["createdAt","keyword","searchVolume","cpc","competition","keywordDifficulty","fetchedAt"] }),
		"order": Flags.string({ options: ["asc","desc"] }),
	};

	descriptor = descriptors["listSavedKeywords"];
}
