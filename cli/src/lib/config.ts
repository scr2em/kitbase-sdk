import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import chalk from 'chalk';

const CONFIG_FILE_NAME = '.kitbasecli';

const CONFIG_TEMPLATE = `# Kitbase CLI Configuration
# WARNING: Add this file to .gitignore to keep your API key secret!
#
# To add to .gitignore, run:
#   echo ".kitbasecli" >> .gitignore

KITBASE_API_KEY=`;

export function getConfigPath(): string {
  return join(process.cwd(), CONFIG_FILE_NAME);
}

export function configExists(): boolean {
  return existsSync(getConfigPath());
}

export function readApiKeyFromConfig(): string | null {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return null;

  try {
    const content = readFileSync(configPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;

      if (trimmed.startsWith('KITBASE_API_KEY=')) {
        const value = trimmed.substring('KITBASE_API_KEY='.length).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          return value.slice(1, -1);
        }
        return value || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function writeApiKeyToConfig(apiKey: string): void {
  writeFileSync(getConfigPath(), CONFIG_TEMPLATE + apiKey + '\n', 'utf-8');
}

export function prompt(question: string): Promise<string> {
  const rl = createInterface({input: process.stdin, output: process.stdout});
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptForApiKey(): Promise<string | null> {
  console.log('\nNo API key found. Let\'s set one up!\n');
  console.log('You can find your API key at: https://kitbase.dev/settings/api-keys\n');

  const apiKey = await prompt('Paste your API key: ');
  if (!apiKey) {
    console.log('\nNo API key provided.\n');
    return null;
  }
  if (apiKey.length < 10) {
    console.log('\nInvalid API key format.\n');
    return null;
  }
  return apiKey;
}

async function promptToSaveApiKey(apiKey: string): Promise<void> {
  if (!process.stdin.isTTY) return;

  const save = await prompt('Save API key to .kitbasecli for future use? (Y/n): ');
  if (save.toLowerCase() !== 'n') {
    writeApiKeyToConfig(apiKey);
    console.log('\nAPI key saved to .kitbasecli');
    console.log(chalk.yellow('Remember to add .kitbasecli to .gitignore!\n'));
  }
}

/**
 * Get API key from all sources.
 * Priority: CLI arg > env var > config file > interactive prompt
 */
export async function getApiKey(options?: {interactive?: boolean; cliApiKey?: string}): Promise<string | null> {
  if (options?.cliApiKey) {
    const existing = readApiKeyFromConfig();
    if (!existing || existing !== options.cliApiKey) {
      await promptToSaveApiKey(options.cliApiKey);
    }
    return options.cliApiKey;
  }

  const envKey = process.env.KITBASE_API_KEY;
  if (envKey) return envKey;

  const configKey = readApiKeyFromConfig();
  if (configKey) return configKey;

  if (options?.interactive !== false && process.stdin.isTTY) {
    const apiKey = await promptForApiKey();
    if (apiKey) {
      await promptToSaveApiKey(apiKey);
      return apiKey;
    }
  }

  return null;
}
