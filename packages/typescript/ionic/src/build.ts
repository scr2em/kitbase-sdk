import { execSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync, readFileSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import type { BuildOptions } from './types.js';
import { BuildError, ValidationError } from './errors.js';

/**
 * Possible output directories for Ionic/Capacitor web builds
 */
const WEB_OUTPUT_DIRS = ['www', 'dist', 'build'];

/**
 * Check if Ionic CLI is installed
 */
export function isIonicInstalled(): boolean {
  try {
    execSync('ionic --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if this is an Ionic/Capacitor project
 */
export function isIonicProject(): boolean {
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return '@ionic/core' in deps || 
           '@ionic/angular' in deps || 
           '@ionic/react' in deps || 
           '@ionic/vue' in deps ||
           '@capacitor/core' in deps;
  } catch {
    return false;
  }
}

/**
 * Get the native version from capacitor config or package.json
 */
export function getNativeVersion(): string {
  const cwd = process.cwd();
  
  // Try capacitor.config.json first
  const capacitorConfigPath = join(cwd, 'capacitor.config.json');
  if (existsSync(capacitorConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(capacitorConfigPath, 'utf-8'));
      if (config.appVersion) {
        return config.appVersion;
      }
    } catch {
      // Continue to package.json
    }
  }
  
  // Fall back to package.json
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version) {
        return packageJson.version;
      }
    } catch {
      // Continue
    }
  }
  
  throw new ValidationError('Could not determine native version. Please specify with --version flag.');
}

/**
 * Find the web output directory
 */
export function findWebOutputDir(customDir?: string): string {
  const cwd = process.cwd();
  
  if (customDir) {
    const fullPath = resolve(cwd, customDir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      return fullPath;
    }
    throw new ValidationError(`Output directory not found: ${fullPath}`);
  }
  
  // Check common output directories
  for (const dir of WEB_OUTPUT_DIRS) {
    const fullPath = join(cwd, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      // Make sure it's not empty
      const contents = readdirSync(fullPath);
      if (contents.length > 0) {
        return fullPath;
      }
    }
  }
  
  throw new BuildError(
    `Web build output not found. Checked: ${WEB_OUTPUT_DIRS.join(', ')}. ` +
    'Make sure the build completed successfully or specify --output-dir.'
  );
}

/**
 * Build the Ionic web app for production
 */
export async function buildIonicWeb(options: BuildOptions): Promise<string> {
  if (!isIonicInstalled()) {
    // Try with npm/npx instead
    console.log('Ionic CLI not found globally, using npm build...');
    await runCommand('npm', ['run', 'build'], 'Building web assets');
  } else {
    await runCommand('ionic', ['build', '--prod'], 'Building web assets');
  }
  
  return findWebOutputDir(options.outputDir);
}

/**
 * Run a command with live output
 */
function runCommand(
  command: string,
  args: string[],
  description: string,
  cwd?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n${description}...`);
    
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new BuildError(`${description} failed with exit code ${code}`, code ?? undefined));
      }
    });
    
    child.on('error', (error) => {
      reject(new BuildError(`Failed to run ${command}: ${error.message}`));
    });
  });
}

/**
 * Create a zip file from a directory
 */
export async function zipDirectory(sourceDir: string, outputPath: string): Promise<string> {
  const archiver = await import('archiver');
  
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver.default('zip', {
      zlib: { level: 9 }, // Maximum compression
    });
    
    output.on('close', () => {
      resolve(outputPath);
    });
    
    archive.on('error', (err) => {
      reject(new BuildError(`Failed to create zip: ${err.message}`));
    });
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Build web app and create zip file
 */
export async function buildAndZip(options: BuildOptions): Promise<string> {
  const cwd = process.cwd();
  let outputDir: string;
  
  if (options.skipBuild) {
    outputDir = findWebOutputDir(options.outputDir);
  } else {
    outputDir = await buildIonicWeb(options);
  }
  
  // Create temp directory for the zip
  const tempDir = join(cwd, '.kitbase-temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  
  // Create zip file
  const zipFileName = `build-${Date.now()}.zip`;
  const zipPath = join(tempDir, zipFileName);
  
  console.log(`\nCreating zip from ${basename(outputDir)}...`);
  await zipDirectory(outputDir, zipPath);
  
  return zipPath;
}

/**
 * Validate that a zip file exists and is readable
 */
export function validateZipFile(filePath: string): void {
  const resolvedPath = resolve(filePath);
  
  if (!existsSync(resolvedPath)) {
    throw new ValidationError(`Zip file not found: ${resolvedPath}`);
  }
  
  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new ValidationError(`Path is not a file: ${resolvedPath}`);
  }
  
  // Check for .zip extension
  if (!resolvedPath.endsWith('.zip')) {
    throw new ValidationError('File must be a .zip archive');
  }
  
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (stats.size > maxSize) {
    throw new ValidationError(`Zip file is too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is 100MB.`);
  }
  
  if (stats.size === 0) {
    throw new ValidationError('Zip file is empty.');
  }
}

/**
 * Clean up temporary files
 */
export function cleanupTemp(): void {
  const tempDir = join(process.cwd(), '.kitbase-temp');
  if (existsSync(tempDir)) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
