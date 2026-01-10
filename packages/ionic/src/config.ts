import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import chalk from 'chalk';

const CONFIG_FILE_NAME = '.kitbasecli';

/**
 * Config file content template
 */
const CONFIG_TEMPLATE = `# Kitbase CLI Configuration
# ⚠️  WARNING: Add this file to .gitignore to keep your API key secret!
#
# To add to .gitignore, run:
#   echo ".kitbasecli" >> .gitignore

KITBASE_API_KEY=`;

/**
 * Get the path to the config file
 */
export function getConfigPath(): string {
  return join(process.cwd(), CONFIG_FILE_NAME);
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Read API key from config file
 */
export function readApiKeyFromConfig(): string | null {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }
      
      // Look for KITBASE_API_KEY=
      if (trimmed.startsWith('KITBASE_API_KEY=')) {
        const value = trimmed.substring('KITBASE_API_KEY='.length).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
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

/**
 * Write API key to config file
 */
export function writeApiKeyToConfig(apiKey: string): void {
  const configPath = getConfigPath();
  const content = CONFIG_TEMPLATE + apiKey + '\n';
  writeFileSync(configPath, content, 'utf-8');
}


/**
 * Prompt user for input
 */
export function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt user for API key with confirmation
 */
export async function promptForApiKey(): Promise<string | null> {
  console.log('\n📋 No API key found. Let\'s set one up!\n');
  console.log('You can find your API key at: https://kitbase.dev/settings/api-keys\n');
  
  const apiKey = await prompt('Paste your API key: ');
  
  if (!apiKey) {
    console.log('\n❌ No API key provided.\n');
    return null;
  }
  
  // Validate API key format (basic check)
  if (apiKey.length < 10) {
    console.log('\n❌ Invalid API key format.\n');
    return null;
  }
  
  return apiKey;
}

/**
 * Get API key from all sources (env, config file, or prompt)
 * Priority: 1. Environment variable, 2. Config file, 3. Interactive prompt
 */
export async function getApiKey(options?: { interactive?: boolean }): Promise<string | null> {
  // 1. Check environment variable first
  const envKey = process.env.KITBASE_API_KEY;
  if (envKey) {
    return envKey;
  }
  
  // 2. Check config file
  const configKey = readApiKeyFromConfig();
  if (configKey) {
    return configKey;
  }
  
  // 3. If interactive mode is enabled, prompt user
  if (options?.interactive !== false && process.stdin.isTTY) {
    const apiKey = await promptForApiKey();
    
    if (apiKey) {
      // Ask to save
      const save = await prompt('Save API key to .kitbasecli for future use? (Y/n): ');
      
      if (save.toLowerCase() !== 'n') {
        writeApiKeyToConfig(apiKey);
        console.log('\n✅ API key saved to .kitbasecli');
        console.log(chalk.yellow('⚠️  Remember to add .kitbasecli to .gitignore!\n'));
      }
      
      return apiKey;
    }
  }
  
  return null;
}

