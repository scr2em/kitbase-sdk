# @kitbase/cli

The Kitbase CLI — do anything the [Kitbase dashboard](https://kitbase.dev) can do, from your terminal.

## Installation

```bash
npm install -g @kitbase/cli
```

Or use without installing:

```bash
npx @kitbase/cli login
```

## Quick Start

```bash
# Log in via your browser (opens a confirmation page, no password typed in the terminal)
kitbase login

# Pick a default organization and project so you don't have to pass --org/--project every time
kitbase use org
kitbase use project

# Now run any command
kitbase feature-flags list
kitbase feature-flags create --flagKey dark-mode --name "Dark Mode" --valueType boolean
kitbase webhooks list --json | jq
```

## How it works

`kitbase login` starts a browser-approved login session, similar to the GitHub CLI: it prints a
short code and opens `https://app.kitbase.dev/cli/authorize?session=...` in your browser. Confirm
the code shown in your terminal matches the one on the page, approve, and the CLI picks up the
session automatically — either instantly (via a local loopback ping) or within a few seconds
(via polling), so it also works over SSH/headless. **Never approve a login you didn't start
yourself.**

Credentials are stored in `~/.config/kitbase/credentials.json` (mode `0600`), one entry per API
base URL. The access token refreshes automatically in the background; the underlying session
lasts 60 days. Run `kitbase logout` to revoke it (server-side) and clear the local credential.

### Authentication modes

- **Browser login** (`kitbase login`) — for interactive use.
- **Private API key** — for CI/CD. Create one in the dashboard (Project Settings → API Keys,
  `sk_kitbase_...`), then either:
  ```bash
  export KITBASE_API_KEY=sk_kitbase_...
  kitbase feature-flags list
  ```
  or pass `--api-key sk_kitbase_...` on any command. A key resolves its own organization and
  project automatically — no need to run `use org`/`use project` first.

### Organization & project context

Most commands operate on a project inside an organization. Resolution order, per command:

1. `--org` / `--project` flags
2. `KITBASE_ORG` / `KITBASE_PROJECT` environment variables
3. The default set via `kitbase use org` / `kitbase use project`
4. (API-key auth only) resolved automatically from the key itself
5. An interactive picker, if you're in a terminal
6. Otherwise, a clear error telling you what to run

Run `kitbase context` at any time to see the current base URL, auth mode, org, and project.

### Command output

Every command prints a human-readable table or key/value view by default. Pass `--json` for
machine-readable output:

```bash
kitbase feature-flags list --json | jq '.data[].flagKey'
```

### Request bodies

Simple fields are individual flags (`--name`, `--enabled`, ...). For anything with nested
objects/arrays, use `--data` instead — accepts a literal JSON string, `@file.json`, or `-` for
stdin:

```bash
kitbase feature-flags create --data '{"flagKey": "dark-mode", "name": "Dark Mode", "valueType": "boolean"}'
echo '{"flagKey": "dark-mode", ...}' | kitbase feature-flags create --data -
kitbase feature-flags create --data @flag.json
```

Individual flags always take precedence over matching keys in `--data`.

### Local / self-hosted backend

```bash
kitbase feature-flags list --local          # shorthand for --base-url http://localhost:8100/api
kitbase feature-flags list --base-url https://api.your-domain.com
```

## Commands

`kitbase --help` lists every topic. A handful are hand-written:

| Command | Description |
| --- | --- |
| `login` | Log in via your browser |
| `logout` | Log out and revoke the session server-side |
| `whoami` | Show the currently logged-in user (or API key context) |
| `use org [slug]` | Set the default organization (interactive picker if omitted) |
| `use project [id]` | Set the default project (interactive picker if omitted) |
| `context` | Show the current base URL, auth mode, org, and project |

Everything else — `feature-flags`, `webhooks`, `projects`, `ai-visibility`, `billing`, `events`,
`funnels`, `integrations`, `sdk-keys`, `private-api-keys`, `organizations`, `members`,
`invitations`, `notifications`, `sessions`, `web-analytics`, and more — is generated directly
from the Kitbase API's OpenAPI spec, one command per operation, grouped into topics matching the
API's resource structure. Run `kitbase <topic> --help` to see what's available under it.

## Development

```bash
pnpm install
pnpm build          # tsc + oclif manifest
pnpm test            # vitest — codegen pipeline unit + integration tests
```

### Regenerating commands

The command tree is generated from the Kitbase backend's `openapi.cli.yaml` (in the sibling
`Flyway` repo) — an audience-scoped subset of the API spec derived from per-operation
`x-audience` annotations (`make derive-specs` in the backend repo). After a backend API change:

```bash
pnpm generate        # regenerates src/generated/api.ts + the full command tree
```

This runs two steps:

- `generate:types` — `openapi-typescript` against the spec, producing the typed `paths`/`components`.
- `generate:commands` — `scripts/generate-commands.ts`, which parses the spec (`scripts/codegen/spec.ts`),
  derives a command id + args + flags per operation (`scripts/codegen/naming.ts`, `flags.ts`),
  and writes command files + `src/generated/descriptors.ts` (`scripts/codegen/emit.ts`).

Generated files carry a `// @generated` banner and are safe to regenerate at will — codegen
deletes stale ones automatically and refuses to overwrite any hand-written command file that
happens to share a path with a generated one (see `scripts/codegen/overrides.ts` for the
denylist/rename escape hatches used to resolve naming collisions or exclude an operation).

## License

MIT
