// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../../runtime/operation-command.js";
import { descriptors } from "../../../generated/descriptors.js";

export default class IntegrationsSlackChannels extends ApiOperationCommand {
	static description = "List Slack channels";

	descriptor = descriptors["listSlackChannels"];
}
