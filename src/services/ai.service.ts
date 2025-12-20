/**
 * AI Service - Groq Integration
 * 
 * Production-ready AI service using Groq's free API for:
 * - Invoice data extraction from text/images
 * - Smart transaction categorization
 * - Financial insights and summaries
 * - Automated reconciliation suggestions
 * 
 * @module services/ai.service
 */

import Groq from 'groq-sdk';
import { env } from '@config/env.js';
import { logger } from '@config/logger.js';
import { ExternalServiceError } from '@utils/errors.js';

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceExtractionResult {
    invoiceNumber?: string;
    date?: string;
    dueDate?: string;
    customerName?: string;
    customerGSTIN?: string;
    items: Array<{
        description: string;
        quantity: number;
        rate: number;
        amount: number;
    }>;
    subtotal: number;
    taxAmount: number;
    total: number;
    confidence: number;
}

interface TransactionCategorizationResult {
    category: string;
    subcategory?: string;
    confidence: number;
    reasoning: string;
}

interface FinancialInsight {
    type: 'warning' | 'info' | 'suggestion';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
}

// ============================================================================
// AI CLIENT
// ============================================================================

/**
 * Groq AI client instance
 */
const groq = new Groq({
    apiKey: env.GROQ_API_KEY || 'gsk_demo_key', // Free tier API key
});

/**
 * Default model to use
 * Options: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
 */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ============================================================================
// INVOICE DATA EXTRACTION
// ============================================================================

/**
 * Extract invoice data from text using AI
 * 
 * Analyzes invoice text and extracts structured data.
 * 
 * @param invoiceText - Raw invoice text (from OCR or manual input)
 * @returns Extracted invoice data
 * 
 * @example
 * ```ts
 * const result = await extractInvoiceData(ocrText);
 * // { invoiceNumber: 'INV-001', total: 15000, items: [...] }
 * ```
 */
export async function extractInvoiceData(
    invoiceText: string
): Promise<InvoiceExtractionResult> {
    try {
        logger.info('Extracting invoice data using AI');

        const prompt = `You are an expert at extracting structured data from invoices. Analyze the following invoice text and extract all relevant information. Return the data in JSON format.

Invoice Text:
${invoiceText}

Extract and return JSON with this structure:
{
  "invoiceNumber": "string or null",
  "date": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "customerName": "string or null",
  "customerGSTIN": "string or null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "total": number,
  "confidence": number (0-1)
}

Important:
- Extract dates in YYYY-MM-DD format
- Parse all numbers correctly
- Set confidence based on how clearly the data is presented
- Return null for fields you cannot find
- Ensure items array has at least one item
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a financial data extraction expert. Always return valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: DEFAULT_MODEL,
            temperature: 0.1, // Low temperature for consistent extraction
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No response from AI');
        }

        const result = JSON.parse(content);

        logger.info({ invoiceNumber: result.invoiceNumber }, 'Invoice data extracted successfully');

        return result;
    } catch (error: any) {
        logger.error({ error }, 'Failed to extract invoice data');
        throw new ExternalServiceError('Groq AI', error.message);
    }
}

// ============================================================================
// TRANSACTION CATEGORIZATION
// ============================================================================

/**
 * Categorize transaction using AI
 * 
 * Analyzes transaction description and suggests appropriate category.
 * 
 * @param description - Transaction description
 * @param amount - Transaction amount (optional, for context)
 * @returns Category suggestion with confidence
 * 
 * @example
 * ```ts
 * const result = await categorizeTransaction('AWS Cloud Services', -3200);
 * // { category: 'Software & Subscriptions', confidence: 0.95 }
 * ```
 */
export async function categorizeTransaction(
    description: string,
    amount?: number
): Promise<TransactionCategorizationResult> {
    try {
        logger.info({ description }, 'Categorizing transaction using AI');

        const prompt = `Categorize the following transaction for an accounting system:

Description: ${description}
${amount ? `Amount: ₹${amount}` : ''}

Available Categories:
- Revenue (Sales, Services, Other Income)
- Cost of Goods Sold (Inventory, Materials)
- Operating Expenses (Rent, Utilities, Salaries, Marketing, Software)
- Assets (Equipment, Inventory Purchase)
- Liabilities (Loans, Payables)
- Equity (Capital, Drawings)

Return JSON with this structure:
{
  "category": "Main category",
  "subcategory": "More specific category or null",
  "confidence": number (0-1),
  "reasoning": "Brief explanation"
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a financial categorization expert with deep knowledge of accounting principles.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: DEFAULT_MODEL,
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No response from AI');
        }

        const result = JSON.parse(content);

        logger.info(
            { category: result.category, confidence: result.confidence },
            'Transaction categorized successfully'
        );

        return result;
    } catch (error: any) {
        logger.error({ error }, 'Failed to categorize transaction');
        throw new ExternalServiceError('Groq AI', error.message);
    }
}

// ============================================================================
// FINANCIAL INSIGHTS
// ============================================================================

/**
 * Generate financial insights from transaction data
 * 
 * Analyzes financial data and provides actionable insights.
 * 
 * @param data - Financial data summary
 * @returns Array of insights
 * 
 * @example
 * ```ts
 * const insights = await generateFinancialInsights({
 *   revenue: 500000,
 *   expenses: 450000,
 *   topExpenses: [...]
 * });
 * ```
 */
export async function generateFinancialInsights(data: {
    revenue: number;
    expenses: number;
    profitMargin: number;
    topExpenses: Array<{ category: string; amount: number }>;
    cashFlow: number;
}): Promise<FinancialInsight[]> {
    try {
        logger.info('Generating financial insights using AI');

        const prompt = `Analyze the following financial data and provide actionable insights:

Revenue: ₹${data.revenue.toLocaleString('en-IN')}
Expenses: ₹${data.expenses.toLocaleString('en-IN')}
Profit Margin: ${data.profitMargin.toFixed(2)}%
Cash Flow: ₹${data.cashFlow.toLocaleString('en-IN')}

Top Expenses:
${data.topExpenses.map((e) => `- ${e.category}: ₹${e.amount.toLocaleString('en-IN')}`).join('\n')}

Provide 3-5 insights as JSON array:
[
  {
    "type": "warning" | "info" | "suggestion",
    "title": "Short title",
    "description": "Detailed insight",
    "impact": "high" | "medium" | "low"
  }
]

Focus on:
- Cash flow concerns
- Expense optimization opportunities
- Revenue growth suggestions
- Financial health indicators
- Risk areas`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a financial advisor expert at analyzing business finances and providing actionable insights.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: DEFAULT_MODEL,
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No response from AI');
        }

        const result = JSON.parse(content);

        // Handle both object with insights key and direct array
        const insights = Array.isArray(result) ? result : result.insights || [];

        logger.info({ count: insights.length }, 'Financial insights generated successfully');

        return insights;
    } catch (error: any) {
        logger.error({ error }, 'Failed to generate financial insights');
        throw new ExternalServiceError('Groq AI', error.message);
    }
}

// ============================================================================
// SMART RECONCILIATION
// ============================================================================

/**
 * Suggest invoice matches for bank transactions
 * 
 * Uses AI to match bank transactions with invoices.
 * 
 * @param transaction - Bank transaction details
 * @param invoices - List of pending invoices
 * @returns Suggested matches with confidence
 */
export async function suggestInvoiceMatches(
    transaction: {
        description: string;
        amount: number;
        date: string;
    },
    invoices: Array<{
        id: number;
        invoiceNumber: string;
        customerName: string;
        amount: number;
        dueDate: string;
    }>
): Promise<Array<{ invoiceId: number; confidence: number; reasoning: string }>> {
    try {
        logger.info({ transaction }, 'Finding invoice matches using AI');

        const prompt = `Match the following bank transaction with the most likely invoice(s):

Transaction:
- Description: ${transaction.description}
- Amount: ₹${transaction.amount}
- Date: ${transaction.date}

Pending Invoices:
${invoices.map((inv) =>
            `- ID: ${inv.id}, Number: ${inv.invoiceNumber}, Customer: ${inv.customerName}, Amount: ₹${inv.amount}, Due: ${inv.dueDate}`
        ).join('\n')}

Return JSON array of matches (can be empty if no good match):
[
  {
    "invoiceId": number,
    "confidence": number (0-1),
    "reasoning": "Why this invoice matches"
  }
]

Consider:
- Amount matching (exact or close)
- Customer name in description
- Date proximity
- Description keywords`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at matching financial transactions with invoices.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: DEFAULT_MODEL,
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No response from AI');
        }

        const result = JSON.parse(content);
        const matches = Array.isArray(result) ? result : result.matches || [];

        logger.info({ matchCount: matches.length }, 'Invoice matches suggested successfully');

        return matches;
    } catch (error: any) {
        logger.error({ error }, 'Failed to suggest invoice matches');
        throw new ExternalServiceError('Groq AI', error.message);
    }
}

// ============================================================================
// CHAT/ASSISTANT
// ============================================================================

/**
 * General purpose AI chat for financial questions
 * 
 * @param message - User's question
 * @param context - Optional context (user's financial data)
 * @returns AI response
 */
export async function chatWithAI(
    message: string,
    context?: {
        revenue?: number;
        expenses?: number;
        recentTransactions?: string[];
    }
): Promise<string> {
    try {
        logger.info({ message }, 'Processing AI chat request');

        const contextPrompt = context
            ? `\n\nUser's Financial Context:
- Revenue: ₹${context.revenue?.toLocaleString('en-IN') || 'N/A'}
- Expenses: ₹${context.expenses?.toLocaleString('en-IN') || 'N/A'}
${context.recentTransactions ? `- Recent Transactions: ${context.recentTransactions.join(', ')}` : ''}`
            : '';

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are Munshi AI, a helpful financial assistant for a business accounting system. You help users understand their finances, answer accounting questions, and provide actionable advice. Be concise but helpful.${contextPrompt}`,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
            model: DEFAULT_MODEL,
            temperature: 0.5,
        });

        const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

        logger.info('AI chat response generated successfully');

        return response;
    } catch (error: any) {
        logger.error({ error }, 'Failed to process AI chat');
        throw new ExternalServiceError('Groq AI', error.message);
    }
}
