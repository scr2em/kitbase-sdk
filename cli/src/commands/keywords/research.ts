// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class KeywordsResearch extends ApiOperationCommand {
	static description = "Research keyword ideas";
	static flags = {
		"seedKeyword": Flags.string({ description: "The topic to expand. Trimmed and lowercased server-side." }),
		"locationCode": Flags.integer({ description: "Overrides the project's default market. Omit to use the project's stored market (US when it has none)." }),
		"languageCode": Flags.string({ description: "Overrides the market's default language. Rejected with 400 when DataForSEO does not serve it in that country." }),
		"resultLimit": Flags.integer({ description: "Rows to request. Labs bills per row, so this is a price knob.", options: ["150","300","500"] }),
		"mode": Flags.string({ description: "Which idea source to ask. `auto` walks related → suggestions → ideas and stops as soon as it has enough non-seed keywords, so it costs between one and three billed calls. Google-Ads-served markets have no source modes and normalize to `auto`.\n", options: ["auto","related","suggestions","ideas"] }),
		"clickstream": Flags.boolean({ description: "Buy clickstream-refined search volumes. DOUBLES the request price and is ignored in Google-Ads-served markets, which do not offer it." }),
	};

	descriptor = descriptors["researchKeywords"];
}
