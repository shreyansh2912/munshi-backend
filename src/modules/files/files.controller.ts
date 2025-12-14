/**
 * Files Module - Controller
 * Handles file upload and management endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as filesService from './files.service.js';
import { successJson } from '@helpers/response.js';
import type { UploadFileInput, UpdateVisibilityInput } from './files.validation.js';

/**
* Upload file
* POST /files/upload
*/
export const uploadFileHandler = async (
    request: FastifyRequest<{ Body: UploadFileInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const data = await request.file();
    if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const file = {
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
        size: buffer.length,
    };

    const uploadedFile = await filesService.uploadFile(
        request.user.orgId,
        request.user.id,
        file,
        request.body
    );

    return successJson(reply, {
        statusCode: 201,
        message: 'File uploaded successfully',
        data: uploadedFile,
    });
};

/**
 * Get file
 * GET /files/:uuid
 */
export const getFileHandler = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const file = await filesService.getFile(request.params.uuid, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'File retrieved successfully',
        data: file,
    });
};

/**
 * List files
 * GET /files
 */
export const listFilesHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const filesList = await filesService.listFiles(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Files retrieved successfully',
        data: filesList,
    });
};

/**
 * Get file URL
 * GET /files/:uuid/url
 */
export const getFileUrlHandler = async (
    request: FastifyRequest<{
        Params: { uuid: string };
        Querystring: { temporary?: string; expires?: string };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const temporary = request.query.temporary === 'true';
    const expiresIn = request.query.expires ? parseInt(request.query.expires) : 3600;

    const url = await filesService.getFileUrl(
        request.params.uuid,
        request.user.orgId,
        temporary,
        expiresIn
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'File URL generated successfully',
        data: { url },
    });
};

/**
 * Download file
 * GET /files/:uuid/download
 */
export const downloadFileHandler = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply
): Promise<void> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { buffer, filename, mimeType } = await filesService.downloadFile(
        request.params.uuid,
        request.user.orgId
    );

    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.header('Content-Type', mimeType || 'application/octet-stream');
    reply.send(buffer);
};

/**
 * Delete file
 * DELETE /files/:uuid
 */
export const deleteFileHandler = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await filesService.deleteFile(request.params.uuid, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'File deleted successfully',
    });
};

/**
 * Update file visibility
 * PATCH /files/:uuid/visibility
 */
export const updateVisibilityHandler = async (
    request: FastifyRequest<{
        Params: { uuid: string };
        Body: UpdateVisibilityInput;
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const file = await filesService.updateFileVisibility(
        request.params.uuid,
        request.user.orgId,
        request.body.visibility
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'File visibility updated successfully',
        data: file,
    });
};
