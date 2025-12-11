// ============================================================================
// MUNSHI MULTI-TENANT SAAS - MONGODB SCHEMA DESIGN
// Unstructured data, logs, AI tasks, raw integrations
// ============================================================================

// ============================================================================
// 1. BANK SYNC RAW DATA
// ============================================================================

// Collection: bank_sync_raw
// Stores raw JSON responses from bank/broker APIs
const bankSyncRawSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    bank_account_id: "uuid-string",
    provider: "finvu|zerodha|axis|hdfc|manual",
    sync_type: "account_statement|holdings|transactions",
    sync_date: "ISODate('2024-01-15T10:30:00Z')",
    request_payload: {
        // Original request sent to provider
        from_date: "2024-01-01",
        to_date: "2024-01-31",
        account_id: "provider-specific-id"
    },
    response_payload: {
        // Complete raw JSON response from provider
        // Structure varies by provider
    },
    response_status: 200,
    response_headers: {},
    parsed_transactions_count: 45,
    processing_status: "pending|processing|completed|failed",
    processing_error: null,
    processed_at: "ISODate('2024-01-15T10:35:00Z')",
    created_at: "ISODate('2024-01-15T10:30:00Z')",
    updated_at: "ISODate('2024-01-15T10:35:00Z')",
    ttl_expires_at: "ISODate('2025-01-15T10:30:00Z')" // Auto-delete after 1 year
};

// Indexes for bank_sync_raw
db.bank_sync_raw.createIndex({ org_id: 1, bank_account_id: 1, sync_date: -1 });
db.bank_sync_raw.createIndex({ org_id: 1, processing_status: 1 });
db.bank_sync_raw.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
db.bank_sync_raw.createIndex({ created_at: -1 });

// ============================================================================
// 2. BROKER HOLDINGS & PORTFOLIO DATA
// ============================================================================

// Collection: broker_holdings_raw
// Raw broker API responses for holdings, portfolio
const brokerHoldingsRawSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    broker_account_id: "uuid-string",
    broker: "zerodha|upstox|angelone|groww",
    data_type: "holdings|positions|orders|trades",
    snapshot_date: "ISODate('2024-01-15T00:00:00Z')",
    raw_data: {
        // Complete broker API response
        holdings: [
            {
                tradingsymbol: "INFY",
                exchange: "NSE",
                isin: "INE009A01021",
                quantity: 100,
                average_price: 1450.50,
                last_price: 1500.00,
                pnl: 4950.00
            }
        ]
    },
    processed: false,
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    ttl_expires_at: "ISODate('2025-01-15T10:00:00Z')"
};

// Indexes
db.broker_holdings_raw.createIndex({ org_id: 1, snapshot_date: -1 });
db.broker_holdings_raw.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 });

// ============================================================================
// 3. AI TASKS & OCR RESULTS
// ============================================================================

// Collection: ai_tasks
// Tracks AI processing tasks (OCR, classification, extraction)
const aiTasksSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    user_id: "uuid-string",
    task_id: "uuid-string", // Unique task identifier
    task_type: "ocr|invoice_extraction|receipt_parsing|document_classification|gst_validation",
    input: {
        file_id: "uuid-string",
        file_path: "s3://bucket/org-id/file.pdf",
        file_type: "pdf|image/jpeg|image/png",
        file_size: 1024000,
        metadata: {}
    },
    model: {
        provider: "openai|google|aws|azure",
        model_name: "gpt-4-vision|gemini-pro-vision|textract",
        version: "1.0"
    },
    status: "queued|processing|completed|failed|cancelled",
    priority: 5, // 1-10, higher = more urgent
    retry_count: 0,
    max_retries: 3,
    output: {
        // Structured output varies by task_type
        extracted_text: "Invoice text...",
        confidence: 0.95,
        entities: {
            invoice_number: "INV-2024-001",
            date: "2024-01-15",
            total_amount: 10000.00,
            vendor_name: "ABC Suppliers",
            gstin: "29ABCDE1234F1Z5"
        },
        line_items: []
    },
    error: null,
    cost: {
        tokens_used: 1500,
        cost_usd: 0.045,
        cost_inr: 3.75
    },
    processing_time_ms: 2500,
    queued_at: "ISODate('2024-01-15T10:00:00Z')",
    started_at: "ISODate('2024-01-15T10:00:05Z')",
    completed_at: "ISODate('2024-01-15T10:00:08Z')",
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    updated_at: "ISODate('2024-01-15T10:00:08Z')"
};

// Indexes
db.ai_tasks.createIndex({ org_id: 1, status: 1, priority: -1 });
db.ai_tasks.createIndex({ org_id: 1, task_type: 1, created_at: -1 });
db.ai_tasks.createIndex({ task_id: 1 }, { unique: true });
db.ai_tasks.createIndex({ "input.file_id": 1 });
db.ai_tasks.createIndex({ created_at: -1 });

// Collection: ocr_results
// Dedicated collection for OCR results with full text
const ocrResultsSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    file_id: "uuid-string",
    task_id: "uuid-string", // Links to ai_tasks
    ocr_provider: "google_vision|aws_textract|azure_ocr|tesseract",
    extracted_text: "Full extracted text from document...",
    structured_data: {
        // Parsed structured data
        pages: [
            {
                page_number: 1,
                text: "Page 1 text...",
                confidence: 0.98,
                blocks: []
            }
        ]
    },
    confidence_score: 0.95,
    language: "en|hi|mr",
    processing_time_ms: 3000,
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    ttl_expires_at: "ISODate('2026-01-15T10:00:00Z')" // 2 year retention
};

// Indexes
db.ocr_results.createIndex({ org_id: 1, file_id: 1 });
db.ocr_results.createIndex({ task_id: 1 });
db.ocr_results.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 });
db.ocr_results.createIndex({ extracted_text: "text" }); // Full-text search

// ============================================================================
// 4. EVENT LOGS & SYSTEM LOGS
// ============================================================================

// Collection: event_logs
// Application events, user actions, system events
const eventLogsSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    user_id: "uuid-string",
    event_type: "user_action|system_event|integration_event|error",
    event_name: "invoice_created|payment_received|bank_sync_completed",
    severity: "debug|info|warning|error|critical",
    message: "Invoice INV-2024-001 created successfully",
    context: {
        entity_type: "invoice",
        entity_id: "uuid-string",
        entity_number: "INV-2024-001",
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0...",
        request_id: "uuid-string"
    },
    metadata: {
        // Additional event-specific data
        invoice_amount: 10000,
        customer_id: "uuid-string"
    },
    timestamp: "ISODate('2024-01-15T10:00:00Z')",
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    ttl_expires_at: "ISODate('2024-04-15T10:00:00Z')" // 90 days retention
};

// Indexes
db.event_logs.createIndex({ org_id: 1, timestamp: -1 });
db.event_logs.createIndex({ org_id: 1, event_type: 1, timestamp: -1 });
db.event_logs.createIndex({ org_id: 1, user_id: 1, timestamp: -1 });
db.event_logs.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 });
db.event_logs.createIndex({ "context.entity_type": 1, "context.entity_id": 1 });

// ============================================================================
// 5. WEBHOOK DELIVERIES & INTEGRATIONS
// ============================================================================

// Collection: webhook_deliveries
// Outgoing webhook delivery logs
const webhookDeliveriesSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    webhook_id: "uuid-string",
    event_type: "invoice.created|payment.received|invoice.paid",
    endpoint_url: "https://customer-webhook.com/munshi",
    http_method: "POST",
    request_headers: {
        "Content-Type": "application/json",
        "X-Munshi-Signature": "sha256=..."
    },
    request_payload: {
        event: "invoice.created",
        data: {
            invoice_id: "uuid-string",
            invoice_number: "INV-2024-001"
        }
    },
    response_status: 200,
    response_headers: {},
    response_body: "OK",
    delivery_status: "success|failed|pending|retry",
    retry_count: 0,
    max_retries: 3,
    next_retry_at: null,
    delivered_at: "ISODate('2024-01-15T10:00:01Z')",
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    ttl_expires_at: "ISODate('2024-02-15T10:00:00Z')" // 30 days retention
};

// Indexes
db.webhook_deliveries.createIndex({ org_id: 1, created_at: -1 });
db.webhook_deliveries.createIndex({ org_id: 1, delivery_status: 1 });
db.webhook_deliveries.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 });

// ============================================================================
// 6. UPLOADED FILES METADATA
// ============================================================================

// Collection: uploaded_files
// Metadata for all uploaded files
const uploadedFilesSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    user_id: "uuid-string",
    file_id: "uuid-string",
    file_name: "invoice_jan_2024.pdf",
    original_name: "Invoice January 2024.pdf",
    file_type: "application/pdf",
    file_size: 1024000,
    storage_provider: "s3|gcs|azure_blob|local",
    storage_path: "s3://munshi-files/org-uuid/2024/01/file-uuid.pdf",
    storage_bucket: "munshi-files",
    storage_key: "org-uuid/2024/01/file-uuid.pdf",
    file_category: "invoice|receipt|bank_statement|gst_return|other",
    linked_entity_type: "invoice|purchase_bill|payment",
    linked_entity_id: "uuid-string",
    ocr_processed: true,
    ocr_task_id: "uuid-string",
    is_public: false,
    access_url: "https://cdn.munshi.com/files/...",
    access_expires_at: "ISODate('2024-01-16T10:00:00Z')",
    tags: ["invoice", "january", "supplier-abc"],
    metadata: {
        width: 1200,
        height: 1600,
        pages: 2
    },
    uploaded_at: "ISODate('2024-01-15T10:00:00Z')",
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    deleted_at: null
};

// Indexes
db.uploaded_files.createIndex({ org_id: 1, uploaded_at: -1 });
db.uploaded_files.createIndex({ org_id: 1, file_category: 1 });
db.uploaded_files.createIndex({ file_id: 1 }, { unique: true });
db.uploaded_files.createIndex({ org_id: 1, linked_entity_type: 1, linked_entity_id: 1 });
db.uploaded_files.createIndex({ tags: 1 });

// ============================================================================
// 7. EMAIL QUEUE & DELIVERY LOGS
// ============================================================================

// Collection: email_queue
// Transactional email queue
const emailQueueSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    email_id: "uuid-string",
    email_type: "invoice|payment_reminder|welcome|password_reset",
    to: ["customer@example.com"],
    cc: [],
    bcc: [],
    from: "noreply@munshi.com",
    reply_to: "support@munshi.com",
    subject: "Invoice INV-2024-001",
    body_html: "<html>...</html>",
    body_text: "Plain text version...",
    attachments: [
        {
            filename: "invoice.pdf",
            path: "s3://munshi-files/...",
            content_type: "application/pdf"
        }
    ],
    template_id: "invoice_template_v1",
    template_data: {
        invoice_number: "INV-2024-001",
        customer_name: "ABC Corp"
    },
    status: "queued|sending|sent|failed|bounced",
    provider: "sendgrid|ses|mailgun",
    provider_message_id: "msg-xyz123",
    sent_at: "ISODate('2024-01-15T10:00:05Z')",
    opened_at: null,
    clicked_at: null,
    bounced_at: null,
    error: null,
    retry_count: 0,
    created_at: "ISODate('2024-01-15T10:00:00Z')",
    ttl_expires_at: "ISODate('2024-02-15T10:00:00Z')" // 30 days
};

// Indexes
db.email_queue.createIndex({ org_id: 1, status: 1 });
db.email_queue.createIndex({ email_id: 1 }, { unique: true });
db.email_queue.createIndex({ created_at: -1 });
db.email_queue.createIndex({ ttl_expires_at: 1 }, { expireAfterSeconds: 0 });

// ============================================================================
// 8. IMPORT/EXPORT JOBS
// ============================================================================

// Collection: import_jobs
// Track bulk import operations (Tally, Excel, CSV)
const importJobsSchema = {
    _id: "ObjectId()",
    org_id: "uuid-string",
    user_id: "uuid-string",
    job_id: "uuid-string",
    import_type: "tally_xml|excel|csv|quickbooks|zoho",
    entity_type: "invoices|customers|products|transactions",
    file_id: "uuid-string",
    file_path: "s3://munshi-imports/...",
    status: "uploaded|validating|validated|importing|completed|failed",
    validation_errors: [
        {
            row: 5,
            field: "gstin",
            error: "Invalid GSTIN format"
        }
    ],
    import_summary: {
        total_rows: 100,
        valid_rows: 95,
        invalid_rows: 5,
        imported_rows: 95,
        failed_rows: 0
    },
    dry_run: false, // If true, validation only
    started_at: "ISODate('2024-01-15T10:00:00Z')",
    completed_at: "ISODate('2024-01-15T10:05:00Z')",
    created_at: "ISODate('2024-01-15T10:00:00Z')"
};

// Indexes
db.import_jobs.createIndex({ org_id: 1, created_at: -1 });
db.import_jobs.createIndex({ job_id: 1 }, { unique: true });
db.import_jobs.createIndex({ org_id: 1, status: 1 });

// ============================================================================
// MONGODB SCHEMA SUMMARY
// ============================================================================

/*
Collections:
1. bank_sync_raw - Raw bank/broker API responses (TTL: 1 year)
2. broker_holdings_raw - Broker portfolio snapshots (TTL: 1 year)
3. ai_tasks - AI processing tasks (OCR, extraction, classification)
4. ocr_results - OCR extracted text and structured data (TTL: 2 years)
5. event_logs - Application events and user actions (TTL: 90 days)
6. webhook_deliveries - Outgoing webhook logs (TTL: 30 days)
7. uploaded_files - File metadata and storage references
8. email_queue - Transactional email queue (TTL: 30 days)
9. import_jobs - Bulk import/export job tracking

All collections include:
- org_id for multi-tenancy
- Proper indexes for common queries
- TTL indexes where appropriate
- created_at/updated_at timestamps
*/
