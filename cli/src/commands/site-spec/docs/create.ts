// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class SiteSpecDocsCreate extends ApiOperationCommand {
	static description = "Upload a planning document";
	static flags = {
		"title": Flags.string({ description: "How the document will be cited, e.g. \"Wireframe v15\"" }),
		"docDate": Flags.string({  }),
		"version": Flags.string({  }),
		"body": Flags.string({ description: "The document's text. Markdown or plain text in v1." }),
	};

	descriptor = descriptors["uploadSpecDoc"];
}
