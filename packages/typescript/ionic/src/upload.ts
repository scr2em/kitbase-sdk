import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { UploadPayload, UploadResponse, KitbaseConfig } from './types.js';
import { ApiError, AuthenticationError, ValidationError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 300000; // 5 minutes for large file uploads

/**
 * Kitbase upload client for pushing builds
 */
export class UploadClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: KitbaseConfig) {
    if (!config.apiKey) {
      throw new ValidationError('API key is required', 'apiKey');
    }
    
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  /**
   * Upload a build to Kitbase
   */
  async upload(payload: UploadPayload): Promise<UploadResponse> {
    this.validatePayload(payload);
    
    const formData = this.createFormData(payload);
    const url = `${this.baseUrl}/v1/builds`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      
      return await response.json() as UploadResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Upload timed out. Please try again.', 408);
      }
      
      if (error instanceof ApiError || error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new ApiError(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  /**
   * Validate the upload payload
   */
  private validatePayload(payload: UploadPayload): void {
    if (!payload.commitHash) {
      throw new ValidationError('Commit hash is required', 'commitHash');
    }
    if (!payload.branchName) {
      throw new ValidationError('Branch name is required', 'branchName');
    }
    if (!payload.nativeVersion) {
      throw new ValidationError('Native version is required', 'nativeVersion');
    }
    if (!payload.file || payload.file.length === 0) {
      throw new ValidationError('Build file is required', 'file');
    }
  }

  /**
   * Create FormData for the upload request
   */
  private createFormData(payload: UploadPayload): FormData {
    const formData = new FormData();
    
    formData.append('commitHash', payload.commitHash);
    formData.append('branchName', payload.branchName);
    formData.append('nativeVersion', payload.nativeVersion);
    
    if (payload.commitMessage) {
      formData.append('commitMessage', payload.commitMessage);
    }
    
    // Create a Blob from the buffer for FormData
    const blob = new Blob([payload.file], { type: 'application/octet-stream' });
    formData.append('file', blob, payload.fileName);
    
    return formData;
  }

  /**
   * Handle error response from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: unknown;
    
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }
    
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError();
    }
    
    const message = this.extractErrorMessage(errorBody, response.statusText);
    throw new ApiError(message, response.status, errorBody);
  }

  /**
   * Extract error message from response body
   */
  private extractErrorMessage(body: unknown, fallback: string): string {
    if (body && typeof body === 'object') {
      if ('message' in body && typeof (body as { message: unknown }).message === 'string') {
        return (body as { message: string }).message;
      }
      if ('error' in body && typeof (body as { error: unknown }).error === 'string') {
        return (body as { error: string }).error;
      }
    }
    return fallback;
  }
}

/**
 * Helper function to create upload payload from file path
 */
export function createUploadPayload(
  filePath: string,
  gitInfo: { commitHash: string; branchName: string; commitMessage?: string },
  nativeVersion: string
): UploadPayload {
  const file = readFileSync(filePath);
  const fileName = basename(filePath);
  
  return {
    commitHash: gitInfo.commitHash,
    branchName: gitInfo.branchName,
    commitMessage: gitInfo.commitMessage,
    nativeVersion,
    file,
    fileName,
  };
}

