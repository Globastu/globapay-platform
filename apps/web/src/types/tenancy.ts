export interface Platform {
  id: string;
  name: string;
  description: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
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
  kybStatus: KybStatus;
  kybData?: KybData;
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected';
  settings: {
    currency: string;
    timezone: string;
    webhookUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
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
  dateOfIncorporation?: string;
  documents: KybDocument[];
  owners: BusinessOwner[];
  bankAccount?: {
    accountType: 'checking' | 'savings';
    routingNumber: string;
    accountNumber: string;
    accountHolderName: string;
  };
  reviewNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KybDocument {
  id: string;
  type: 'articles_of_incorporation' | 'ein_letter' | 'bank_statement' | 'utility_bill' | 'other';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
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
  dateOfBirth?: string;
}

export interface KybStepStatus {
  step: string;
  name: string;
  status: 'completed' | 'current' | 'upcoming' | 'blocked';
  description: string;
}

export interface MerchantOnboardingProgress {
  merchantId: string;
  currentStep: number;
  totalSteps: number;
  steps: KybStepStatus[];
  completionPercentage: number;
  estimatedTimeRemaining?: string;
  blockers?: string[];
}

export interface PlatformFilters {
  status: string;
  search: string;
  page: number;
  limit: number;
}

export interface MerchantFilters {
  platformId?: string;
  status: string;
  kybStatus: string;
  search: string;
  page: number;
  limit: number;
}