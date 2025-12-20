/**
 * AI Module - Routes
 * 
 * API routes for AI-powered features
 */

import { FastifyInstance } from 'fastify';
import {
    extractInvoiceHandler,
    categorizeTransactionHandler,
    generateInsightsHandler,
    suggestMatchesHandler,
    chatHandler,
} from './ai.controller.js';
import { authenticate } from '@middlewares/authenticate.js';

export default async function aiRoutes(app: FastifyInstance) {
    // All AI routes require authentication
    app.addHook('preHandler', authenticate);

    /**
     * Extract invoice data from text
     * POST /ai/extract-invoice
     */
    app.post('/extract-invoice', extractInvoiceHandler);

    /**
     * Categorize transaction
     * POST /ai/categorize-transaction
     */
    app.post('/categorize-transaction', categorizeTransactionHandler);

    /**
     * Generate financial insights
     * POST /ai/financial-insights
     */
    app.post('/financial-insights', generateInsightsHandler);

    /**
     * Suggest invoice matches for reconciliation
     * POST /ai/suggest-matches
     */
    app.post('/suggest-matches', suggestMatchesHandler);

    /**
     * Chat with AI assistant
     * POST /ai/chat
     */
    app.post('/chat', chatHandler);
}
