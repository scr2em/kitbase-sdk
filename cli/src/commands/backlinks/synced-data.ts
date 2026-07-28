// @generated from openapi.yaml — do not edit. Run `npm run generate:commands`.
import { Args, Flags } from "@oclif/core";

import { ApiOperationCommand } from "../../runtime/operation-command.js";
import { descriptors } from "../../generated/descriptors.js";

export default class BacklinksSyncedData extends ApiOperationCommand {
	static description = "Delete synced link-graph data";

	descriptor = descriptors["deleteBacklinkSyncedData"];
}
