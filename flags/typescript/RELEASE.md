# Releasing `@kitbase/flags`

This package is published to npm using [Changesets](https://github.com/changesets/changesets). Changesets is configured at the monorepo root (`/.changeset/config.json`) and orchestrated through pnpm scripts in the root `package.json`.

> All commands below are run from the **monorepo root** (`/Users/mohamed/private/kitbase-sdk`), unless otherwise noted.

---

## Prerequisites

1. You are logged into npm with publish rights to the `@kitbase` scope:

   ```bash
   npm whoami            # confirm identity
   npm login             # if not logged in
   ```

2. Working tree is clean and you're on `main` (or a release branch) with the latest changes pulled:

   ```bash
   git status
   git pull origin main
   ```

3. Dependencies are installed:

   ```bash
   pnpm install
   ```

---

## Step 1 — Add a changeset

For every PR that should trigger a release, add a changeset describing the change:

```bash
pnpm changeset
```

The CLI will prompt:

1. **Which packages changed?** — select `@kitbase/flags` (space to toggle, enter to confirm). Skip unchanged packages.
2. **Semver bump for each package**:
   - `patch` — bug fixes, internal refactors, doc-only changes
   - `minor` — new features, new public methods, additive config options
   - `major` — breaking changes (removed/renamed APIs, changed signatures)
3. **Summary** — one or two lines that will appear in the changelog.

This writes a markdown file to `.changeset/<random-name>.md`. Commit it with your PR:

```bash
git add .changeset/*.md
git commit -m "chore: changeset for <feature>"
```

> Tip: you can edit the generated file before committing if you want to refine the summary.

---

## Step 2 — Version the packages

When you're ready to cut a release (typically right before publishing), apply all pending changesets:

```bash
pnpm version
```

This:

- Reads every file in `.changeset/`
- Bumps `flags/typescript/package.json` according to the highest pending bump
- Updates `flags/typescript/CHANGELOG.md` with the summaries
- Deletes the consumed changeset files

Review the diff to confirm the new version number and changelog entry are correct, then commit:

```bash
git add -A
git commit -m "chore: version packages"
```

---

## Step 3 — Build and publish

The root `release` script builds all packages, then runs `changeset publish`:

```bash
pnpm release
```

What this does for `@kitbase/flags`:

1. Runs `pnpm -r build`, which executes `tsup` in `flags/typescript/` and produces:
   - `dist/index.{js,cjs}` — ESM and CJS for the main entry
   - `dist/web/index.{js,cjs}` and `dist/server/index.{js,cjs}` — OpenFeature subpaths
   - `dist/index.global.js` — minified IIFE bundle for `unpkg`/`jsDelivr` (OpenFeature web SDK is bundled in)
   - All `.d.ts` / `.d.cts` declaration files
2. Runs `changeset publish`, which calls `npm publish` for every package whose version is newer than what's on the registry.

> The `prepublishOnly` script in `flags/typescript/package.json` re-runs the build as a safety net, so the published tarball always reflects the current source.

---

## Step 4 — Push the version commit and tags

```bash
git push origin main --follow-tags
```

`changeset publish` creates a git tag for each released version (e.g. `@kitbase/flags@0.2.0`). `--follow-tags` pushes those alongside the commit.

---

## Step 5 — Verify the release

```bash
npm view @kitbase/flags version           # latest published version
npm view @kitbase/flags dist-tags         # tag map (latest, next, etc.)
```

Check the CDN propagated (may take 1–2 minutes):

```bash
curl -sI https://unpkg.com/@kitbase/flags@<new-version>/dist/index.global.js | head -1
```

Open the QA console at `flags/typescript/example/index.html` — it loads from `https://unpkg.com/@kitbase/flags` (latest), so a hard refresh should pick up the new bundle.

---

## Pre-releases (optional)

To publish a `next` / `beta` / `alpha` track:

```bash
pnpm changeset pre enter next         # enter pre-release mode (tag = "next")
pnpm changeset                        # add changesets as usual
pnpm version                          # produces 0.2.0-next.0, etc.
pnpm release                          # publishes under the `next` dist-tag
pnpm changeset pre exit               # exit pre-release when done
```

---

## Common situations

**Adding a feature that touches the IIFE bundle.** No special steps — `pnpm build` rebuilds `dist/index.global.js` automatically. Just verify the bundle still works (open the example page) before publishing.

**Republishing after a botched release.** Don't `npm unpublish`. Bump the version (a new patch changeset) and publish again. To deprecate the bad version:

```bash
npm deprecate @kitbase/flags@<bad-version> "Use @kitbase/flags@<good-version> instead"
```

**Forgot to add a changeset.** No release will happen for that PR. Add a changeset in a follow-up PR, or run `pnpm changeset` directly on `main` and push.

**Multiple changesets, one release.** `pnpm version` consolidates them. The new package version uses the **highest** bump (a single `major` overrides any number of `minor`/`patch`), and the changelog lists all summaries.

**Linked packages.** `@kitbase/flags` is **not** linked to any other package (see `.changeset/config.json`). Its version is fully independent — releasing it does not bump analytics or messaging packages.

---

## Reference

- Root scripts: `pnpm changeset`, `pnpm version`, `pnpm release`
- Changesets config: `/.changeset/config.json`
- Package manifest: `flags/typescript/package.json`
- Changelog: `flags/typescript/CHANGELOG.md` (generated)
- Changesets docs: <https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md>
