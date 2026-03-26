import {execSync, spawn} from 'node:child_process';
import {existsSync, readdirSync, statSync, readFileSync, createWriteStream, mkdirSync, rmSync} from 'node:fs';
import {join, resolve, basename} from 'node:path';
import type {BuildOptions} from './types.js';
import {BuildError, ValidationError} from '../lib/errors.js';

const WEB_OUTPUT_DIRS = ['www', 'dist', 'build'];

export function isIonicInstalled(): boolean {
  try {
    execSync('ionic --version', {stdio: 'pipe'});
    return true;
  } catch {
    return false;
  }
}

export function isIonicProject(): boolean {
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) return false;

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = {...packageJson.dependencies, ...packageJson.devDependencies};
    return (
      '@ionic/core' in deps ||
      '@ionic/angular' in deps ||
      '@ionic/react' in deps ||
      '@ionic/vue' in deps ||
      '@capacitor/core' in deps
    );
  } catch {
    return false;
  }
}

export function getNativeVersion(): string {
  const cwd = process.cwd();

  // Try capacitor.config.json first
  const capacitorConfigPath = join(cwd, 'capacitor.config.json');
  if (existsSync(capacitorConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(capacitorConfigPath, 'utf-8'));
      if (config.appVersion) return config.appVersion;
    } catch {
      // fall through
    }
  }

  // Fall back to package.json
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version) return packageJson.version;
    } catch {
      // fall through
    }
  }

  throw new ValidationError('Could not determine native version. Use --version flag.');
}

export function findWebOutputDir(customDir?: string): string {
  const cwd = process.cwd();

  if (customDir) {
    const fullPath = resolve(cwd, customDir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) return fullPath;
    throw new ValidationError(`Output directory not found: ${fullPath}`);
  }

  for (const dir of WEB_OUTPUT_DIRS) {
    const fullPath = join(cwd, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      if (readdirSync(fullPath).length > 0) return fullPath;
    }
  }

  throw new BuildError(
    `Web build output not found. Checked: ${WEB_OUTPUT_DIRS.join(', ')}. ` +
      'Make sure the build completed successfully or specify --output-dir.',
  );
}

export async function buildIonicWeb(options: BuildOptions): Promise<string> {
  if (!isIonicInstalled()) {
    console.log('Ionic CLI not found globally, using npm build...');
    await runCommand('npm', ['run', 'build'], 'Building web assets');
  } else {
    await runCommand('ionic', ['build', '--prod'], 'Building web assets');
  }

  return findWebOutputDir(options.outputDir);
}

function runCommand(command: string, args: string[], description: string, cwd?: string): Promise<void> {
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

export async function zipDirectory(sourceDir: string, outputPath: string): Promise<string> {
  const archiver = await import('archiver');

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver.default('zip', {zlib: {level: 9}});

    output.on('close', () => resolve(outputPath));
    archive.on('error', (err) => reject(new BuildError(`Failed to create zip: ${err.message}`)));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export interface BuildAndZipResult {
  zipPath: string;
  zipSize: number;
}

export async function buildAndZip(options: BuildOptions): Promise<BuildAndZipResult> {
  const cwd = process.cwd();
  const outputDir = options.skipBuild ? findWebOutputDir(options.outputDir) : await buildIonicWeb(options);

  const tempDir = join(cwd, '.kitbase-temp');
  if (!existsSync(tempDir)) mkdirSync(tempDir, {recursive: true});

  const zipPath = join(tempDir, `build-${Date.now()}.zip`);

  console.log(`\nCreating zip from ${basename(outputDir)}...`);
  await zipDirectory(outputDir, zipPath);

  return {zipPath, zipSize: statSync(zipPath).size};
}

export function validateZipFile(filePath: string): void {
  const resolvedPath = resolve(filePath);

  if (!existsSync(resolvedPath)) throw new ValidationError(`Zip file not found: ${resolvedPath}`);
  const stats = statSync(resolvedPath);
  if (!stats.isFile()) throw new ValidationError(`Path is not a file: ${resolvedPath}`);
  if (!resolvedPath.endsWith('.zip')) throw new ValidationError('File must be a .zip archive');

  const maxSize = 100 * 1024 * 1024;
  if (stats.size > maxSize) {
    throw new ValidationError(`Zip file too large (${Math.round(stats.size / 1024 / 1024)}MB). Max is 100MB.`);
  }
  if (stats.size === 0) throw new ValidationError('Zip file is empty.');
}

export function cleanupTemp(): void {
  const tempDir = join(process.cwd(), '.kitbase-temp');
  if (existsSync(tempDir)) {
    try {
      rmSync(tempDir, {recursive: true, force: true});
    } catch {
      // ignore
    }
  }
}
