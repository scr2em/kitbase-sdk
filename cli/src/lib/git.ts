import {execSync} from 'node:child_process';
import type {GitInfo} from './types.js';
import {GitError} from './errors.js';

function execGit(command: string): string {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new GitError(`Failed to execute: git ${command}`);
  }
}

export function getCommitHash(): string {
  return execGit('rev-parse HEAD');
}

export function getBranchName(): string {
  const branch = execGit('rev-parse --abbrev-ref HEAD');

  if (branch === 'HEAD') {
    // Detached HEAD — check CI env vars
    const ciBranch =
      process.env.GITHUB_REF_NAME ||
      process.env.GITHUB_HEAD_REF ||
      process.env.CI_COMMIT_BRANCH ||
      process.env.CIRCLE_BRANCH ||
      process.env.BITBUCKET_BRANCH ||
      process.env.TRAVIS_BRANCH ||
      process.env.BRANCH_NAME;

    if (ciBranch) return ciBranch;
    throw new GitError('Unable to determine branch name (detached HEAD state)');
  }

  return branch;
}

export function getCommitMessage(): string {
  return execGit('log -1 --pretty=%B');
}

export function getGitInfo(): GitInfo {
  return {
    commitHash: getCommitHash(),
    branchName: getBranchName(),
    commitMessage: getCommitMessage(),
  };
}

export function isGitRepository(): boolean {
  try {
    execGit('rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}
