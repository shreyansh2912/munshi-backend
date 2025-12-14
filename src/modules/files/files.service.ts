/**
 * Files Module - Service
 * Business logic for file management
 */

import { db } from '@db/mysql/client.js';
import { files } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
// import { storage, Visibility } from '@storage';
import { NotFoundError } from '@helpers/errors.js';
import type { UploadFileInput } from './files.validation.js';
import { storage, Visibility } from '@storage/index.js';

/**
 * Generate a unique filename
 */
const generateUniqueFilename = (originalFilename: string): string => {
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${basename}-${timestamp}-${random}${ext}`;
};

/**
 * Upload a file
 * @param orgId - Organization ID
 * @param userId - User ID uploading the file
 * @param file - File buffer and metadata
 * @param data - Upload options
 * @returns File record
 */
export const uploadFile = async (
    orgId: number,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    data: UploadFileInput
) => {
    const fileUuid = uuidv4();
    const filename = generateUniqueFilename(file.originalname);
    const diskName = data.disk || 'local';
    const filePath = `${orgId}/${filename}`;

    // Upload to storage
    await storage.disk(diskName).put(filePath, file.buffer, {
        visibility: data.visibility === 'public' ? Visibility.PUBLIC : Visibility.PRIVATE,
        mimeType: file.mimetype,
    });

    // Save to database
    const [fileRecord] = await db
        .insert(files)
        .values({
            orgId,
            uuid: fileUuid,
            disk: diskName,
            path: filePath,
            filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            visibility: data.visibility,
            uploadedBy: userId,
        })
        .$returningId();

    return getFile(fileUuid, orgId);
};

/**
 * Get file by UUID
 * @param uuid - File UUID
 * @param orgId - Organization ID
 * @returns File record
 */
export const getFile = async (uuid: string, orgId: number) => {
    const file = await db.query.files.findFirst({
        where: and(eq(files.uuid, uuid), eq(files.orgId, orgId)),
    });

    if (!file) {
        throw new NotFoundError('File not found');
    }

    return file;
};

/**
 * List files for an organization
 * @param orgId - Organization ID
 * @returns Array of files
 */
export const listFiles = async (orgId: number) => {
    return db.query.files.findMany({
        where: eq(files.orgId, orgId),
        orderBy: (files, { desc }) => [desc(files.createdAt)],
    });
};

/**
 * Get file URL
 * @param uuid - File UUID
 * @param orgId - Organization ID
 * @param temporary - Whether to generate temporary URL
 * @param expiresIn - Expiration time in seconds (for temporary URLs)
 * @returns File URL
 */
export const getFileUrl = async (
    uuid: string,
    orgId: number,
    temporary: boolean = false,
    expiresIn: number = 3600
): Promise<string> => {
    const file = await getFile(uuid, orgId);

    const disk = storage.disk(file.disk);

    if (temporary || file.visibility === 'private') {
        return disk.temporaryUrl(file.path, expiresIn);
    }

    return disk.url(file.path);
};

/**
 * Download file
 * @param uuid - File UUID
 * @param orgId - Organization ID
 * @returns File buffer and metadata
 */
export const downloadFile = async (uuid: string, orgId: number) => {
    const file = await getFile(uuid, orgId);

    const disk = storage.disk(file.disk);
    const buffer = await disk.get(file.path);

    return {
        buffer,
        filename: file.originalFilename,
        mimeType: file.mimeType,
    };
};

/**
 * Delete file
 * @param uuid - File UUID
 * @param orgId - Organization ID
 */
export const deleteFile = async (uuid: string, orgId: number) => {
    const file = await getFile(uuid, orgId);

    // Delete from storage
    const disk = storage.disk(file.disk);
    await disk.delete(file.path);

    // Soft delete from database
    await db
        .update(files)
        .set({ deletedAt: new Date() })
        .where(and(eq(files.uuid, uuid), eq(files.orgId, orgId)));

    return true;
};

/**
 * Update file visibility
 * @param uuid - File UUID
 * @param orgId - Organization ID
 * @param visibility - New visibility
 */
export const updateFileVisibility = async (
    uuid: string,
    orgId: number,
    visibility: 'public' | 'private'
) => {
    const file = await getFile(uuid, orgId);

    // Update storage visibility
    const disk = storage.disk(file.disk);
    await disk.setVisibility(
        file.path,
        visibility === 'public' ? Visibility.PUBLIC : Visibility.PRIVATE
    );

    // Update database
    await db
        .update(files)
        .set({ visibility })
        .where(and(eq(files.uuid, uuid), eq(files.orgId, orgId)));

    return getFile(uuid, orgId);
};
