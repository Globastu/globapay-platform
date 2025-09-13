export interface Platform {
  id: string;
  name: string;
  description: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Merchant {
  id: string;
  platformId?: string; // null for standalone merchants
  name: string;
  legalName: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  kybStatus: KybStatus;
  kybData?: KybData;
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected';
  settings: {
    currency: string;
    timezone: string;
    webhookUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
}

export type KybStatus = 
  | 'not_started'
  | 'pending_documents' 
  | 'documents_submitted'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected';

export interface KybData {
  businessType: 'sole_proprietorship' | 'partnership' | 'llc' | 'corporation' | 'non_profit';
  taxId?: string;
  registrationNumber?: string;
  dateOfIncorporation?: Date;
  documents: KybDocument[];
  owners: BusinessOwner[];
  bankAccount?: {
    accountType: 'checking' | 'savings';
    routingNumber: string;
    accountNumber: string;
    accountHolderName: string;
  };
  reviewNotes?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
}

export interface KybDocument {
  id: string;
  type: 'articles_of_incorporation' | 'ein_letter' | 'bank_statement' | 'utility_bill' | 'other';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface BusinessOwner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  ownershipPercentage: number;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  ssn?: string; // Last 4 digits only
  dateOfBirth?: Date;
}

export interface PlatformCreateRequest {
  name: string;
  description: string;
  website?: string;
}

export interface MerchantCreateRequest {
  platformId?: string;
  name: string;
  legalName: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    webhookUrl?: string;
  };
}

export interface MerchantStatusUpdate {
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected';
  kybStatus?: KybStatus;
  reviewNotes?: string;
}

export interface KybProvider {
  name: string;
  submitKyb(merchantId: string, kybData: KybData): Promise<KybSubmissionResult>;
  checkStatus(merchantId: string, submissionId: string): Promise<KybStatusResult>;
  updateMerchantInfo(merchantId: string, merchantData: Partial<Merchant>): Promise<void>;
}

export interface KybSubmissionResult {
  success: boolean;
  submissionId: string;
  status: KybStatus;
  message?: string;
  requiredDocuments?: string[];
  estimatedReviewTime?: string;
}

export interface KybStatusResult {
  status: KybStatus;
  message?: string;
  reviewNotes?: string;
  requiredActions?: string[];
  lastUpdated: Date;
}