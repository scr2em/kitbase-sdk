# @kitbase/ionic

Official Kitbase CLI for Ionic - Build and upload your Ionic web builds to Kitbase for OTA (Over-The-Air) updates.

## Installation

```bash
npm install -g @kitbase/ionic
# or
pnpm add -g @kitbase/ionic
# or
yarn global add @kitbase/ionic
```

Or use directly with npx:

```bash
npx @kitbase/ionic push
```

## Setup

### API Key

The CLI will look for your API key in the following order:

1. **Environment variable** - `KITBASE_API_KEY`
2. **Config file** - `.kitbasecli` in your project root
3. **Interactive prompt** - If running in a terminal, you'll be prompted to enter your key

#### Option 1: Interactive Setup (Recommended)

Simply run the CLI without any configuration:

```bash
npx @kitbase/ionic push
```

You'll be prompted to enter your API key, and it will be saved to `.kitbasecli` for future use.

#### Option 2: Environment Variable

```bash
export KITBASE_API_KEY=your_api_key_here
```

#### Option 3: Config File

Create a `.kitbasecli` file in your project root:

```
KITBASE_API_KEY=your_api_key_here
```

> ⚠️ **Important:** Add `.kitbasecli` to your `.gitignore` to keep your API key secret!

#### Option 4: .env File

```env
KITBASE_API_KEY=your_api_key_here
```

### Custom API URL (Optional)

To use a custom API endpoint (e.g., for local development or self-hosted):

```bash
export KITBASE_API_URL=http://localhost:3000
```

Or in `.env` / `.kitbasecli`:

```
KITBASE_API_URL=http://localhost:3000
```

## Usage

### Push Command

Build and upload your Ionic web app to Kitbase:

```bash
# Build and upload (default)
npx @kitbase/ionic push

# Skip build, use existing output directory
npx @kitbase/ionic push --skip-build

# Specify custom output directory
npx @kitbase/ionic push --output-dir ./dist

# Upload existing zip file
npx @kitbase/ionic push --file ./build.zip

# Override version
npx @kitbase/ionic push --version 1.2.3

# Override git information (useful in CI)
npx @kitbase/ionic push --commit abc123 --branch main --message "Release v1.0"

# Verbose output
npx @kitbase/ionic push --verbose
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--skip-build` | `-s` | Skip building and use existing build output | `false` |
| `--output-dir` | `-o` | Custom web build output directory | auto-detected (`www`, `dist`, or `build`) |
| `--file` | `-f` | Path to existing zip file to upload | - |
| `--version` | `-v` | Override app version | auto-detected from `package.json` |
| `--commit` | - | Override git commit hash | auto-detected |
| `--branch` | - | Override git branch name | auto-detected |
| `--message` | - | Override git commit message | auto-detected |
| `--verbose` | - | Show verbose output | `false` |

## How It Works

1. **Build** - Runs `ionic build --prod` (or `npm run build` if Ionic CLI is not installed)
2. **Zip** - Creates a zip archive of the web build output (www/dist/build folder)
3. **Upload** - Sends the zip to Kitbase with git metadata for OTA distribution

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Kitbase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Push to Kitbase
        env:
          KITBASE_API_KEY: ${{ secrets.KITBASE_API_KEY }}
        run: npx @kitbase/ionic push
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  image: node:20
  script:
    - npm ci
    - npx @kitbase/ionic push
  variables:
    KITBASE_API_KEY: $KITBASE_API_KEY
  only:
    - main
```

### Bitbucket Pipelines

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Deploy to Kitbase
          image: node:20
          script:
            - npm ci
            - npx @kitbase/ionic push
```

## Programmatic Usage

You can also use the SDK programmatically:

```typescript
import {
  UploadClient,
  getGitInfo,
  getNativeVersion,
  buildAndZip,
  createUploadPayload,
} from '@kitbase/ionic';

// Create upload client
const client = new UploadClient({
  apiKey: process.env.KITBASE_API_KEY!,
});

// Get git information
const gitInfo = getGitInfo();

// Get app version
const version = getNativeVersion();

// Build and zip the web app
const zipPath = await buildAndZip({ skipBuild: false });

// Create and upload payload
const payload = createUploadPayload(zipPath, gitInfo, version);
const response = await client.upload(payload);

console.log('Build uploaded:', response.buildId);
```

## Requirements

- Node.js 18 or later
- Git repository (for automatic commit/branch detection)
- Ionic/Capacitor project with web build capability

## Troubleshooting

### "KITBASE_API_KEY environment variable is not set"

Make sure you've set the `KITBASE_API_KEY` environment variable or created a `.env` file.

### "Web build output not found"

Make sure your build completed successfully. The CLI looks for output in these directories:
- `www` (Ionic/Capacitor default)
- `dist` (Vite/Angular default)
- `build` (React default)

You can specify a custom directory with `--output-dir`:

```bash
npx @kitbase/ionic push --output-dir ./my-output
```

### "Unable to determine branch name (detached HEAD state)"

In CI environments with detached HEAD, use the `--branch` option:

```bash
npx @kitbase/ionic push --branch $CI_BRANCH_NAME
```

### "Could not determine version"

Specify the version manually:

```bash
npx @kitbase/ionic push --version 1.0.0
```

## License

MIT
