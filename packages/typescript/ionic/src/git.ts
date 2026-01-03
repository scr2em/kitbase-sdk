import { execSync } from 'node:child_process';
import type { GitInfo } from './types.js';
import { GitError } from './errors.js';

/**
 * Execute a git command and return the output
 */
function execGit(command: string): string {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new GitError(`Failed to execute git command: git ${command}`);
  }
}

/**
 * Get the current git commit hash
 */
export function getCommitHash(): string {
  try {
    return execGit('rev-parse HEAD');
  } catch {
    throw new GitError('Failed to get commit hash. Make sure you are in a git repository.');
  }
}

/**
 * Get the current git branch name
 */
export function getBranchName(): string {
  try {
    // Try to get branch name from HEAD
    const branch = execGit('rev-parse --abbrev-ref HEAD');
    
    // If HEAD is detached, try to get from CI environment variables
    if (branch === 'HEAD') {
      // Check common CI environment variables
      const ciBranch = 
        process.env.GITHUB_REF_NAME ||
        process.env.GITHUB_HEAD_REF ||
        process.env.CI_COMMIT_BRANCH ||
        process.env.CIRCLE_BRANCH ||
        process.env.BITBUCKET_BRANCH ||
        process.env.TRAVIS_BRANCH ||
        process.env.BRANCH_NAME;
      
      if (ciBranch) {
        return ciBranch;
      }
      
      throw new GitError('Unable to determine branch name (detached HEAD state)');
    }
    
    return branch;
  } catch (error) {
    if (error instanceof GitError) {
      throw error;
    }
    throw new GitError('Failed to get branch name. Make sure you are in a git repository.');
  }
}

/**
 * Get the current git commit message
 */
export function getCommitMessage(): string {
  try {
    return execGit('log -1 --pretty=%B');
  } catch {
    throw new GitError('Failed to get commit message. Make sure you are in a git repository.');
  }
}

/**
 * Get all git information
 */
export function getGitInfo(): GitInfo {
  return {
    commitHash: getCommitHash(),
    branchName: getBranchName(),
    commitMessage: getCommitMessage(),
  };
}

/**
 * Check if the current directory is a git repository
 */
export function isGitRepository(): boolean {
  try {
    execGit('rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}




