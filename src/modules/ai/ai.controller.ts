/**
 * AI Module - Controller
 * 
 * API endpoints for AI-powered features
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as aiService from '@services/ai.service.js';
import { successJson } from '@helpers/response.js';

/**
 * Extract invoice data from text
 * POST /ai/extract-invoice
 */
export const extractInvoiceHandler = async (
    request: FastifyRequest<{ Body: { text: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const result = await aiService.extractInvoiceData(request.body.text);

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoice data extracted successfully',
        data: result,
    });
};

/**
 * Categorize transaction
 * POST /ai/categorize-transaction
 */
export const categorizeTransactionHandler = async (
    request: FastifyRequest<{ Body: { description: string; amount?: number } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { description, amount } = request.body;
    const result = await aiService.categorizeTransaction(description, amount);

    return successJson(reply, {
        statusCode: 200,
        message: 'Transaction categorized successfully',
        data: result,
    });
};

/**
 * Generate financial insights
 * POST /ai/financial-insights
 */
export const generateInsightsHandler = async (
    request: FastifyRequest<{
        Body: {
            revenue: number;
            expenses: number;
            profitMargin: number;
            topExpenses: Array<{ category: string; amount: number }>;
            cashFlow: number;
        };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const insights = await aiService.generateFinancialInsights(request.body);

    return successJson(reply, {
        statusCode: 200,
        message: 'Financial insights generated successfully',
        data: insights,
    });
};

/**
 * Suggest invoice matches for reconciliation
 * POST /ai/suggest-matches
 */
export const suggestMatchesHandler = async (
    request: FastifyRequest<{
        Body: {
            transaction: {
                description: string;
                amount: number;
                date: string;
            };
            invoices: Array<{
                id: number;
                invoiceNumber: string;
                customerName: string;
                amount: number;
                dueDate: string;
            }>;
        };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { transaction, invoices } = request.body;
    const matches = await aiService.suggestInvoiceMatches(transaction, invoices);

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoice matches suggested successfully',
        data: matches,
    });
};

/**
 * Chat with AI assistant
 * POST /ai/chat
 */
export const chatHandler = async (
    request: FastifyRequest<{
        Body: {
            message: string;
            context?: {
                revenue?: number;
                expenses?: number;
                recentTransactions?: string[];
            };
        };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { message, context } = request.body;
    const response = await aiService.chatWithAI(message, context);

    return successJson(reply, {
        statusCode: 200,
        message: 'AI response generated successfully',
        data: { response },
    });
};
