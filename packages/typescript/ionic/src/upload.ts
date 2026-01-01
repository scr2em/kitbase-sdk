import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import type { UploadPayload, UploadResponse, KitbaseConfig } from './types.js';
import { ApiError, AuthenticationError, ValidationError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.kitbase.dev';
const TIMEOUT = 300000; // 5 minutes for large file uploads

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded so far */
  uploaded: number;
  /** Total bytes to upload */
  total: number;
  /** Progress percentage (0-100) */
  percent: number;
}

/**
 * Upload options
 */
export interface UploadOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
}

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
  async upload(payload: UploadPayload, options?: UploadOptions): Promise<UploadResponse> {
    this.validatePayload(payload);
    
    const { body, boundary } = this.createMultipartBody(payload);
    const url = new URL(`${this.baseUrl}/v1/builds`);
    
    return new Promise((resolve, reject) => {
      const isHttps = url.protocol === 'https:';
      const requestFn = isHttps ? httpsRequest : httpRequest;
      
      const req = requestFn({
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          'X-API-Key': this.apiKey,
        },
        timeout: TIMEOUT,
      }, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const statusCode = res.statusCode || 0;
            
            if (statusCode === 401 || statusCode === 403) {
              reject(new AuthenticationError());
              return;
            }
            
            if (statusCode >= 400) {
              let errorBody: unknown;
              try {
                errorBody = JSON.parse(responseData);
              } catch {
                errorBody = null;
              }
              const message = this.extractErrorMessage(errorBody, res.statusMessage || 'Unknown error');
              reject(new ApiError(message, statusCode, errorBody));
              return;
            }
            
            const result = JSON.parse(responseData) as UploadResponse;
            resolve(result);
          } catch (error) {
            reject(new ApiError(`Failed to parse response: ${error}`, 0));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new ApiError(`Upload failed: ${error.message}`, 0));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new ApiError('Upload timed out. Please try again.', 408));
      });
      
      // Track upload progress
      if (options?.onProgress) {
        const total = body.length;
        let uploaded = 0;
        const chunkSize = 64 * 1024; // 64KB chunks
        
        const writeChunk = (offset: number) => {
          const end = Math.min(offset + chunkSize, total);
          const chunk = body.slice(offset, end);
          
          const canContinue = req.write(chunk);
          uploaded = end;
          
          options.onProgress!({
            uploaded,
            total,
            percent: Math.round((uploaded / total) * 100),
          });
          
          if (uploaded < total) {
            if (canContinue) {
              // Use setImmediate to avoid blocking
              setImmediate(() => writeChunk(end));
            } else {
              // Wait for drain event before continuing
              req.once('drain', () => writeChunk(end));
            }
          } else {
            req.end();
          }
        };
        
        // Start writing chunks
        writeChunk(0);
      } else {
        // No progress tracking, write all at once
        req.write(body);
        req.end();
      }
    });
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
   * Create multipart form body
   */
  private createMultipartBody(payload: UploadPayload): { body: Buffer; boundary: string } {
    const boundary = `----KitbaseBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
    const parts: Buffer[] = [];
    
    // Add text fields
    const textFields: Record<string, string> = {
      commitHash: payload.commitHash,
      branchName: payload.branchName,
      nativeVersion: payload.nativeVersion,
    };
    
    if (payload.commitMessage) {
      textFields.commitMessage = payload.commitMessage;
    }
    
    for (const [name, value] of Object.entries(textFields)) {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
        `${value}\r\n`
      ));
    }
    
    // Add file
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${payload.fileName}"\r\n` +
      `Content-Type: application/zip\r\n\r\n`
    ));
    parts.push(payload.file);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    return {
      body: Buffer.concat(parts),
      boundary,
    };
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
