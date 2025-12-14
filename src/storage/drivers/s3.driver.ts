/**
 * AWS S3 Storage Driver
 * Stores files in Amazon S3 with public/private access control
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    PutObjectAclCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageDriver, Visibility, UploadOptions, FileMetadata, DiskConfig } from '@storage/types.js';

export class S3Driver implements StorageDriver {
    private client: S3Client;
    private bucket: string;
    private region: string;
    private baseUrl: string | undefined;

    constructor(config: DiskConfig) {
        if (!config.bucket) {
            throw new Error('S3 bucket is required');
        }

        this.bucket = config.bucket;
        this.region = config.region || 'us-east-1';
        this.baseUrl = config.url;

        this.client = new S3Client({
            region: this.region,
            ...(config.key && config.secret && {
                credentials: {
                    accessKeyId: config.key,
                    secretAccessKey: config.secret,
                },
            }),
        });
    }

    /**
     * Get S3 ACL based on visibility
     */
    private getAcl(visibility: Visibility): string {
        return visibility === Visibility.PUBLIC ? 'public-read' : 'private';
    }

    /**
     * Store a file in S3
     */
    async put(filePath: string, content: Buffer, options?: UploadOptions): Promise<void> {
        const visibility = options?.visibility || Visibility.PRIVATE;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
            Body: content,
            ACL: this.getAcl(visibility),
            ContentType: options?.mimeType,
            Metadata: options?.metadata,
        });

        await this.client.send(command);
    }

    /**
     * Get file content from S3
     */
    async get(filePath: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            });

            const response = await this.client.send(command);

            if (!response.Body) {
                throw new Error('Empty response body');
            }

            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as any) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } catch (error: any) {
            if (error.name === 'NoSuchKey') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw error;
        }
    }

    /**
     * Check if file exists in S3
     */
    async exists(filePath: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Delete a file from S3
     */
    async delete(filePath: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
        });

        await this.client.send(command);
    }

    /**
     * Get public URL for a file
     */
    url(filePath: string): string {
        if (this.baseUrl) {
            return `${this.baseUrl}/${filePath}`;
        }

        // Default S3 URL format
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
    }

    /**
     * Get temporary presigned URL for a private file
     */
    async temporaryUrl(filePath: string, expiresIn: number): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });
        return url;
    }

    /**
     * Set file visibility (ACL)
     */
    async setVisibility(filePath: string, visibility: Visibility): Promise<void> {
        const command = new PutObjectAclCommand({
            Bucket: this.bucket,
            Key: filePath,
            ACL: this.getAcl(visibility),
        });

        await this.client.send(command);
    }

    /**
     * Get file metadata
     */
    async getMetadata(filePath: string): Promise<FileMetadata> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            });

            const response = await this.client.send(command);

            return {
                path: filePath,
                size: response.ContentLength || 0,
                mimeType: response.ContentType,
                lastModified: response.LastModified,
            };
        } catch (error: any) {
            if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw error;
        }
    }
}
