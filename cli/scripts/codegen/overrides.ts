/**
 * Hand-curated exceptions to the mechanical naming/inclusion rules in naming.ts. Codegen fails
 * hard on any unresolved command-id collision, so this file is the escape hatch: exclude an
 * operation entirely, or force a specific id when the derived one collides or reads poorly.
 */

/** Whole tags excluded from the generated command tree. */
export const DENYLIST_TAGS = new Set([
	"Authentication", // browser login/signup/passkey/2FA flows — hand-written (login/logout), not generic CRUD
	"CLI Auth", // the kitbase-login session endpoints themselves — hand-written in commands/login.ts
	"SDK", // runtime SDK endpoints for mobile/web clients, not dashboard actions
	"Contact", // public marketing-site contact form
	"Ingestion", // server/edge log-drain ingestion, not a dashboard action
	"CLI", // api key context lookup — used internally by lib/context.ts, not exposed directly
]);

/** Individual operations excluded despite their tag being generated. */
export const DENYLIST_OPERATION_IDS = new Set([
	"createUserAccount", // public signup — superseded by the /auth/signup/* flow (Authentication tag)
	"startPasskeyRegistration", // requires an in-browser WebAuthn ceremony, not CLI-automatable
	"finishPasskeyRegistration",
	"startSlackOAuth", // requires the dashboard's OAuth redirect URI, not CLI-automatable
	"completeSlackOAuth",
	"changePassword", // too sensitive/high-stakes for a bare CLI flag flow
	"cancelSubscription", // destructive billing action — dashboard only for now
]);

/**
 * Forces specific operations to a given id (array of topic/verb segments), overriding the
 * mechanically-derived one. Used to break collisions or fix awkward auto-generated names.
 */
export const ID_OVERRIDES: Record<string, string[]> = {
	// Users tag ops that read oddly under a generic "users" topic — fold into account-style ids.
	updateCurrentUser: ["account", "update"],
	getCurrentUserWithOrgContext: ["account", "get"],
	getTwoFactorStatus: ["two-factor", "status"],
	setupTwoFactor: ["two-factor", "setup"],
	enableTwoFactor: ["two-factor", "enable"],
	disableTwoFactor: ["two-factor", "disable"],
	regenerateBackupCodes: ["two-factor", "regenerate-backup-codes"],
	listPasskeys: ["passkeys", "list"],
	renamePasskey: ["passkeys", "update"],
	deletePasskey: ["passkeys", "delete"],

	// Roles & Permissions
	listRolesWithPermissions: ["roles", "list-with-permissions"],

	// Invitations: two different "accept"/"reject" shapes (by id vs by email token) collide.
	acceptInvitationByToken: ["invitations", "accept-by-token"],
	rejectInvitationByToken: ["invitations", "reject-by-token"],
	rejectInvitationById: ["invitations", "reject"],

	// Org-level Slack-style subscriptions vs. project-level integration subscriptions otherwise
	// land one "list" apart from each other under the same "integrations subscriptions" prefix.
	listIntegrationSubscriptions: ["integrations", "list-subscriptions"],

	// "Delete all views" vs "delete one view by id" both derive to "in-app-messages views delete".
	clearInAppMessageViews: ["in-app-messages", "views", "clear"],

	// Singular resources with a GET+PATCH pair mechanically derive a "list" verb (our default for
	// any multi-method GET), which reads wrong for a one-object resource — not a collection.
	getProjectSettings: ["settings", "get"],
	getCurrentOrganization: ["organizations", "current", "get"],

	// "/{orgSlug}/invite" is a single bare literal, landing under its own "invite" topic instead
	// of alongside the rest of the invitation lifecycle commands.
	sendInvitation: ["invitations", "create"],
};
