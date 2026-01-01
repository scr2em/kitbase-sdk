import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getGitInfo, isGitRepository } from './git.js';
import { buildAndZip, getNativeVersion, validateZipFile, cleanupTemp, isIonicProject } from './build.js';
import { UploadClient, createUploadPayload } from './upload.js';
import type { PushOptions } from './types.js';
import {
  KitbaseError,
  ConfigurationError,
  ValidationError,
  AuthenticationError,
  ApiError,
  BuildError,
  GitError,
} from './errors.js';

// Load environment variables
loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get package version
 */
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format error message for display
 */
function formatError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return `${chalk.red('Authentication Error:')} ${error.message}\n\n` +
      chalk.dim('Make sure KITBASE_API_KEY is set in your environment or .env file.');
  }
  
  if (error instanceof ApiError) {
    return `${chalk.red('API Error')} ${chalk.dim(`(${error.statusCode})`)}: ${error.message}`;
  }
  
  if (error instanceof BuildError) {
    return `${chalk.red('Build Error:')} ${error.message}`;
  }
  
  if (error instanceof GitError) {
    return `${chalk.red('Git Error:')} ${error.message}`;
  }
  
  if (error instanceof ValidationError) {
    return `${chalk.red('Validation Error:')} ${error.message}`;
  }
  
  if (error instanceof ConfigurationError) {
    return `${chalk.red('Configuration Error:')} ${error.message}`;
  }
  
  if (error instanceof KitbaseError) {
    return `${chalk.red('Error:')} ${error.message}`;
  }
  
  if (error instanceof Error) {
    return `${chalk.red('Error:')} ${error.message}`;
  }
  
  return `${chalk.red('Error:')} An unknown error occurred`;
}

/**
 * Main push command handler
 */
async function pushCommand(options: PushOptions): Promise<void> {
  const spinner = ora();
  
  try {
    // Check for API key
    const apiKey = process.env.KITBASE_API_KEY;
    if (!apiKey) {
      throw new ConfigurationError(
        'KITBASE_API_KEY environment variable is not set.\n' +
        'Set it in your environment or create a .env file with:\n' +
        'KITBASE_API_KEY=your_api_key_here'
      );
    }
    
    console.log(chalk.bold.cyan('\n🚀 Kitbase Ionic Push\n'));
    
    // Validate project
    if (!options.file && !isIonicProject()) {
      console.log(chalk.yellow('⚠️  Warning: This does not appear to be an Ionic project.\n'));
    }
    
    // Get git information
    spinner.start('Collecting git information...');
    
    let gitInfo: { commitHash: string; branchName: string; commitMessage?: string };
    
    if (options.commit && options.branch) {
      // Use provided git info
      gitInfo = {
        commitHash: options.commit,
        branchName: options.branch,
        commitMessage: options.message,
      };
    } else {
      // Collect from git
      if (!isGitRepository()) {
        spinner.fail('Not a git repository');
        throw new GitError(
          'This is not a git repository. Either run this command from a git repository ' +
          'or provide --commit and --branch options.'
        );
      }
      
      const collectedGitInfo = getGitInfo();
      gitInfo = {
        commitHash: options.commit || collectedGitInfo.commitHash,
        branchName: options.branch || collectedGitInfo.branchName,
        commitMessage: options.message || collectedGitInfo.commitMessage,
      };
    }
    
    spinner.succeed(
      `Git info: ${chalk.dim(gitInfo.branchName)} @ ${chalk.dim(gitInfo.commitHash.substring(0, 7))}`
    );
    
    // Get native version
    spinner.start('Getting version...');
    let nativeVersion: string;
    try {
      nativeVersion = options.version || getNativeVersion();
    } catch {
      if (options.version) {
        nativeVersion = options.version;
      } else {
        spinner.fail('Could not determine version');
        throw new ValidationError('Could not determine version. Please specify with --version flag.');
      }
    }
    spinner.succeed(`Version: ${chalk.dim(nativeVersion)}`);
    
    // Build or use existing zip
    let zipFilePath: string;
    let zipSize: number;
    
    if (options.file) {
      // Use provided zip file
      spinner.start('Validating zip file...');
      validateZipFile(options.file);
      zipFilePath = options.file;
      // Get file size for existing file
      const { statSync } = await import('node:fs');
      zipSize = statSync(options.file).size;
      spinner.succeed(`Using zip file: ${chalk.dim(zipFilePath)} ${chalk.cyan(`(${formatFileSize(zipSize)})`)}`);
    } else {
      // Build and zip the app
      spinner.stop();
      const result = await buildAndZip({
        skipBuild: options.skipBuild,
        outputDir: options.outputDir,
      });
      zipFilePath = result.zipPath;
      zipSize = result.zipSize;
      spinner.succeed(`Build zipped: ${chalk.dim(zipFilePath)} ${chalk.cyan(`(${formatFileSize(zipSize)})`)}`);
    }
    
    // Upload the build
    spinner.start('Uploading to Kitbase...');
    
    const client = new UploadClient({ apiKey });
    const payload = createUploadPayload(zipFilePath, gitInfo, nativeVersion);
    
    if (options.verbose) {
      spinner.stop();
      console.log(chalk.dim('\nUpload payload:'));
      console.log(chalk.dim(`  Commit: ${payload.commitHash}`));
      console.log(chalk.dim(`  Branch: ${payload.branchName}`));
      console.log(chalk.dim(`  Version: ${payload.nativeVersion}`));
      console.log(chalk.dim(`  File: ${payload.fileName} (${Math.round(payload.file.length / 1024)}KB)`));
      console.log();
      spinner.start('Uploading to Kitbase...');
    }
    
    const response = await client.upload(payload);
    
    spinner.succeed('Build uploaded successfully!');
    
    // Cleanup temp files
    if (!options.file) {
      cleanupTemp();
    }
    
    console.log(chalk.bold.green('\n✅ Push complete!\n'));
    
    if (response.buildId) {
      console.log(chalk.dim(`Build ID: ${response.buildId}`));
    }
    if (response.message) {
      console.log(chalk.dim(response.message));
    }
    
    console.log();
  } catch (error) {
    spinner.stop();
    cleanupTemp();
    console.error('\n' + formatError(error) + '\n');
    process.exit(1);
  }
}

/**
 * Create and configure the CLI program
 */
function createProgram(): Command {
  const program = new Command();
  
  program
    .name('kitbase-ionic')
    .description('Kitbase CLI for Ionic - Build and upload your Ionic web builds for OTA updates')
    .version(getVersion());
  
  program
    .command('push')
    .description('Build and upload your Ionic web app to Kitbase')
    .option('-s, --skip-build', 'Skip building and use existing build output', false)
    .option('-o, --output-dir <path>', 'Custom web build output directory (default: www, dist, or build)')
    .option('-f, --file <path>', 'Path to existing zip file to upload')
    .option('-v, --version <version>', 'Override app version')
    .option('--commit <hash>', 'Override git commit hash')
    .option('--branch <name>', 'Override git branch name')
    .option('--message <message>', 'Override git commit message')
    .option('--verbose', 'Show verbose output', false)
    .action(async (opts) => {
      const options: PushOptions = {
        skipBuild: opts.skipBuild,
        outputDir: opts.outputDir,
        file: opts.file,
        version: opts.version,
        commit: opts.commit,
        branch: opts.branch,
        message: opts.message,
        verbose: opts.verbose,
      };
      
      await pushCommand(options);
    });
  
  // Add a default command hint
  program
    .action(() => {
      program.help();
    });
  
  return program;
}

// Run the CLI
const program = createProgram();
program.parse();
