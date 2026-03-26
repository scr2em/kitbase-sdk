# @kitbase/cli

Kitbase CLI for managing your Kitbase projects from the terminal.

## Installation

### Production (from npm)

```bash
npm install -g @kitbase/cli
```

Or use it without installing:

```bash
npx @kitbase/cli ionic push
```

### Local development

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Build the CLI
cd cli
pnpm build

# Run via dev entry point (uses TypeScript source, auto-discovers commands)
node bin/dev.js --help

# Or link globally for local testing
pnpm link --global
kitbase --help
```

To rebuild on file changes during development:

```bash
pnpm dev
```

## Setup

Initialize your project with an SDK key:

```bash
kitbase init
```

This creates a `.kitbasecli` file in your project root and adds it to `.gitignore`.

You can also pass values directly:

```bash
kitbase init --api-key sk_live_xxx
```

For self-hosted instances, provide your API URL:

```bash
kitbase init --api-key sk_live_xxx --base-url https://api.mycompany.com
```

This writes both values to `.kitbasecli`:

```
KITBASE_API_KEY=sk_live_xxx
KITBASE_API_URL=https://api.mycompany.com
```

### Configuration resolution

Both the SDK key and API base URL are resolved in the same priority order (first match wins):

| Setting | CLI flag | Environment variable | Config file key |
|---|---|---|---|
| SDK key | `--api-key` | `KITBASE_API_KEY` | `KITBASE_API_KEY` |
| API URL | `--base-url` | `KITBASE_API_URL` | `KITBASE_API_URL` |

If no API URL is configured, it defaults to `https://api.kitbase.dev`.

## Commands

### `kitbase init`

Initialize Kitbase CLI config in the current project.

```bash
kitbase init                      # Interactive prompt for SDK key
kitbase init --api-key sk_live_xxx  # Non-interactive
kitbase init --force              # Overwrite existing config
```

### `kitbase ionic push`

Build and upload your Ionic/Capacitor web app to Kitbase for OTA updates.

```bash
# Build and upload
kitbase ionic push

# Skip build, upload existing output
kitbase ionic push --skip-build

# Upload a pre-built zip
kitbase ionic push --file ./build.zip --version 1.0.0

# CI/CD usage (non-interactive)
kitbase ionic push --api-key $KITBASE_API_KEY --skip-build
```

**Flags:**

| Flag | Short | Description |
|---|---|---|
| `--skip-build` | `-s` | Skip building, use existing build output |
| `--output-dir` | `-o` | Custom web build output directory |
| `--file` | `-f` | Path to an existing zip file to upload |
| `--version` | `-v` | Override app version |
| `--api-key` | `-k` | SDK key for authentication |
| `--base-url` | | Override API base URL |
| `--commit` | | Override git commit hash |
| `--branch` | | Override git branch name |
| `--message` | | Override git commit message |

## CI/CD

Set `KITBASE_API_KEY` as an environment variable in your CI pipeline:

```yaml
# GitHub Actions
- name: Push to Kitbase
  env:
    KITBASE_API_KEY: ${{ secrets.KITBASE_API_KEY }}
  run: npx @kitbase/cli ionic push --skip-build
```

For self-hosted instances, also set `KITBASE_API_URL`:

```yaml
- name: Push to Kitbase (self-hosted)
  env:
    KITBASE_API_KEY: ${{ secrets.KITBASE_API_KEY }}
    KITBASE_API_URL: ${{ secrets.KITBASE_API_URL }}
  run: npx @kitbase/cli ionic push --skip-build
```

## API type generation

The CLI uses [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) to generate type-safe API clients from the backend OpenAPI specs.

```bash
# Regenerate SDK API types
pnpm generate:types

# Regenerate Dashboard API types (requires fixing broken $refs in openapi.yaml)
pnpm generate:types:dashboard
```

Generated types live in `src/generated/` and should be committed to the repo.

## Project structure

```
cli/
  bin/
    run.js              # Production entry point
    dev.js              # Development entry point
  src/
    commands/
      init.ts           # kitbase init
      ionic/
        push.ts         # kitbase ionic push
    ionic/              # Ionic-specific modules
      build.ts
      upload.ts
      types.ts
    lib/                # Shared modules
      api-client.ts     # openapi-fetch typed clients
      config.ts         # SDK key resolution
      errors.ts         # Error hierarchy
      git.ts            # Git info collection
      types.ts          # Shared types
    generated/
      sdk-api.ts        # Auto-generated from openapi-sdk.yaml
    base-command.ts     # Shared oclif base command
    index.ts
```

Adding a new command namespace (e.g. `kitbase flutter push`) is done by creating `src/commands/flutter/push.ts` and `src/flutter/` for its module logic.
