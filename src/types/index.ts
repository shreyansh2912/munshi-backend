/**
 * Central Types File - Backend
 * All shared types, interfaces, and DTOs for the Munshi backend
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> {
    success: true;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    errorCode: string;
    details?: unknown;
    timestamp: string;
}

/**
 * Success response options
 */
export interface SuccessOptions<T = unknown> {
    statusCode?: number;
    message?: string;
    data?: T | undefined;
}

/**
 * Error response options
 */
export interface ErrorOptions {
    statusCode: number;
    message: string;
    errorCode: string;
    details?: unknown;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
    id: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isMfaEnabled: boolean;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

// ============================================================================
// Organization Types
// ============================================================================

export interface DeviceFingerprint {
    id: string;
    userId: string;
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
    lastUsedAt: Date;
    createdAt: Date;
}

export interface RefreshToken {
    id: string;
    token: string;
    userId: string;
    deviceFingerprint: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface UserCreateInput {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    [key: string]: any;
}

export interface RefreshTokenCreateInput {
    token: string;
    userId: string;
    deviceFingerprint: string;
    expiresAt: Date;
    [key: string]: any;
}

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization {
    id: number;
    uuid: string;
    name: string;
    legalName: string | null;
    gstin: string | null;
    pan: string | null;
    tan: string | null;
    cin: string | null;
    businessType: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
    industry: string | null;
    currency: string;
    timezone: string;
    fiscalYearStartMonth: number;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string;
    logoUrl: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    subscriptionPlan: string;
    subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
    trialEndsAt: Date | null;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrganizationRequest {
    name: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    businessType?: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
    industry?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
}

export interface UpdateOrganizationRequest {
    name?: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    businessType?: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
    industry?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    website?: string;
}

export interface OrganizationMember {
    id: number;
    userId: number;
    orgId: number;
    roleId: number;
    status: 'active' | 'invited' | 'suspended' | 'left';
    joinedAt: Date | null;
    user?: User;
    role?: Role;
}

export type MemberRole = 'admin' | 'member' | 'viewer';

// ============================================================================
// Role Types
// ============================================================================

export interface Role {
    id: number;
    orgId: number | null;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: string[] | null;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
    id: number;
    orgId: number;
    uuid: string;
    customerCode: string | null;
    name: string;
    legalName: string | null;
    gstin: string | null;
    pan: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPincode: string | null;
    billingCountry: string;
    shippingAddressLine1: string | null;
    shippingAddressLine2: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingPincode: string | null;
    shippingCountry: string;
    creditLimit: number;
    paymentTermsDays: number;
    accountId: number | null;
    isActive: boolean;
    meta: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCustomerRequest {
    name: string;
    legalName?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    pan?: string;
    contactPerson?: string;
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPincode?: string;
    shippingAddressLine1?: string;
    shippingAddressLine2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    creditLimit?: number;
    paymentTermsDays?: number;
}

export interface UpdateCustomerRequest {
    name?: string;
    legalName?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    pan?: string;
    contactPerson?: string;
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPincode?: string;
    shippingAddressLine1?: string;
    shippingAddressLine2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    creditLimit?: number;
    paymentTermsDays?: number;
    isActive?: boolean;
}

export type CustomerStatus = 'active' | 'inactive';

// ============================================================================
// Invoice Types
// ============================================================================

export interface Invoice {
    id: number;
    orgId: number;
    uuid: string;
    invoiceNumber: string;
    customerId: number;
    invoiceDate: Date;
    dueDate: Date;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes: string | null;
    terms: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    id: number;
    invoiceId: number;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
}

export interface CreateInvoiceRequest {
    customerId: number;
    invoiceDate?: string;
    dueDate: string;
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
    notes?: string;
    terms?: string;
}

export interface UpdateInvoiceRequest {
    customerId?: number;
    invoiceDate?: string;
    dueDate?: string;
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
    notes?: string;
    terms?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'pending' | 'overdue' | 'cancelled';

// ============================================================================
// Ledger/Accounting Types
// ============================================================================

export interface ChartOfAccount {
    id: number;
    orgId: number;
    code: string;
    name: string;
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentId: number | null;
    isSystem: boolean;
    isActive: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface LedgerAccount {
    id: number;
    orgId: number;
    uuid: string;
    coaId: number;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
    openingBalance: number;
    currentBalance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateLedgerRequest {
    name: string;
    code: string;
    coaId: number;
    description?: string;
    openingBalance?: number;
}

export interface UpdateLedgerRequest {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface JournalEntry {
    id: number;
    orgId: number;
    uuid: string;
    entryNumber: string;
    entryDate: Date;
    entryType: 'manual' | 'invoice' | 'payment' | 'adjustment';
    referenceType: string | null;
    referenceId: number | null;
    description: string | null;
    status: 'draft' | 'posted' | 'reversed';
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalLine {
    id: number;
    journalEntryId: number;
    orgId: number;
    accountId: number;
    debit: number;
    credit: number;
    description: string | null;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
    id: number;
    orgId: number;
    uuid: string;
    productCode: string | null;
    name: string;
    description: string | null;
    category: string | null;
    unit: string | null;
    sellingPrice: number;
    costPrice: number;
    taxRate: number;
    hsnCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductRequest {
    name: string;
    productCode?: string;
    description?: string;
    category?: string;
    unit?: string;
    sellingPrice: number;
    costPrice?: number;
    taxRate?: number;
    hsnCode?: string;
}

export interface UpdateProductRequest {
    name?: string;
    productCode?: string;
    description?: string;
    category?: string;
    unit?: string;
    sellingPrice?: number;
    costPrice?: number;
    taxRate?: number;
    hsnCode?: string;
    isActive?: boolean;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
    id: number;
    orgId: number;
    uuid: string;
    paymentNumber: string;
    customerId: number | null;
    invoiceId: number | null;
    paymentDate: Date;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'other';
    referenceNumber: string | null;
    notes: string | null;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePaymentRequest {
    customerId?: number;
    invoiceId?: number;
    paymentDate?: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'other';
    referenceNumber?: string;
    notes?: string;
}

export interface UpdatePaymentRequest {
    paymentDate?: string;
    amount?: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'other';
    referenceNumber?: string;
    notes?: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Request Config Types
// ============================================================================

export interface RequestConfig {
    skipAuth?: boolean;
    skipRetry?: boolean;
    skipCache?: boolean;
    timeout?: number;
    headers?: Record<string, string>;
}

// ============================================================================
// Error Types
// ============================================================================

export class APIClientError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public code: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'APIClientError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public fields?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
