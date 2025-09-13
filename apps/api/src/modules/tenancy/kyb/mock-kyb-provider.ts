import type { 
  KybProvider, 
  KybData, 
  KybSubmissionResult, 
  KybStatusResult, 
  KybStatus, 
  Merchant 
} from '../types';

export class MockKybProvider implements KybProvider {
  name = 'Mock KYB Provider';
  private submissions = new Map<string, { submissionId: string; status: KybStatus; submittedAt: Date }>();

  async submitKyb(merchantId: string, kybData: KybData): Promise<KybSubmissionResult> {
    // Simulate API delay
    await this.delay(1500);

    const submissionId = `kyb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate different outcomes based on business data
    let status: KybStatus = 'documents_submitted';
    let message = 'KYB submission received and is under review';
    const requiredDocuments: string[] = [];

    // Basic validation
    if (!kybData.businessType) {
      status = 'pending_documents';
      message = 'Business type is required';
      requiredDocuments.push('Business registration documents');
    }

    if (!kybData.taxId && kybData.businessType !== 'sole_proprietorship') {
      status = 'pending_documents';
      message = 'Tax identification number is required for this business type';
      requiredDocuments.push('EIN Letter or Tax ID documentation');
    }

    if (kybData.documents.length === 0) {
      status = 'pending_documents';
      message = 'At least one business document is required';
      requiredDocuments.push('Articles of incorporation or business license');
    }

    if (kybData.owners.length === 0) {
      status = 'pending_documents';
      message = 'At least one business owner must be specified';
      requiredDocuments.push('Owner information and identification');
    }

    // Check ownership percentages
    const totalOwnership = kybData.owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);
    if (Math.abs(totalOwnership - 100) > 0.01) {
      status = 'additional_info_required';
      message = `Total ownership percentages must equal 100%. Current total: ${totalOwnership}%`;
    }

    // Simulate random review outcomes for complete submissions
    if (status === 'documents_submitted') {
      const random = Math.random();
      if (random < 0.1) {
        status = 'rejected';
        message = 'Business does not meet our requirements';
      } else if (random < 0.3) {
        status = 'additional_info_required';
        message = 'Additional information required for verification';
        requiredDocuments.push('Additional bank statements', 'Proof of business address');
      } else if (random < 0.5) {
        status = 'under_review';
        message = 'Application is under manual review';
      } else if (random < 0.8) {
        status = 'approved';
        message = 'KYB verification completed successfully';
      }
    }

    this.submissions.set(merchantId, {
      submissionId,
      status,
      submittedAt: new Date(),
    });

    return {
      success: status !== 'rejected',
      submissionId,
      status,
      message,
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : undefined,
      estimatedReviewTime: this.getEstimatedReviewTime(status),
    };
  }

  async checkStatus(merchantId: string, submissionId: string): Promise<KybStatusResult> {
    // Simulate API delay
    await this.delay(500);

    const submission = this.submissions.get(merchantId);
    
    if (!submission || submission.submissionId !== submissionId) {
      throw new Error('Submission not found');
    }

    // Simulate status progression for under_review submissions
    if (submission.status === 'under_review') {
      const daysSinceSubmission = Math.floor(
        (Date.now() - submission.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceSubmission >= 3) {
        const random = Math.random();
        if (random < 0.7) {
          submission.status = 'approved';
        } else if (random < 0.9) {
          submission.status = 'additional_info_required';
        } else {
          submission.status = 'rejected';
        }
      }
    }

    const result: KybStatusResult = {
      status: submission.status,
      lastUpdated: new Date(),
    };

    switch (submission.status) {
      case 'pending_documents':
        result.message = 'Waiting for required documents to be uploaded';
        result.requiredActions = ['Upload business registration documents'];
        break;
      case 'documents_submitted':
        result.message = 'Documents received, initial review in progress';
        break;
      case 'under_review':
        result.message = 'Application under manual review by compliance team';
        break;
      case 'additional_info_required':
        result.message = 'Additional information needed to complete verification';
        result.requiredActions = ['Provide additional bank statements', 'Verify business address'];
        break;
      case 'approved':
        result.message = 'KYB verification completed successfully';
        break;
      case 'rejected':
        result.message = 'Application rejected - business does not meet requirements';
        result.reviewNotes = 'Unable to verify business information. Please contact support for details.';
        break;
    }

    return result;
  }

  async updateMerchantInfo(merchantId: string, merchantData: Partial<Merchant>): Promise<void> {
    // Simulate API delay
    await this.delay(300);

    // In a real implementation, this would update the merchant info with the KYB provider
    console.log(`Mock KYB Provider: Updated merchant ${merchantId} information`, {
      name: merchantData.name,
      email: merchantData.email,
      website: merchantData.website,
    });
  }

  private getEstimatedReviewTime(status: KybStatus): string {
    switch (status) {
      case 'documents_submitted':
      case 'under_review':
        return '2-3 business days';
      case 'additional_info_required':
        return '1-2 business days after information is provided';
      case 'approved':
      case 'rejected':
        return 'Complete';
      default:
        return 'Pending submission';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test helper methods
  public simulateStatusChange(merchantId: string, newStatus: KybStatus): void {
    const submission = this.submissions.get(merchantId);
    if (submission) {
      submission.status = newStatus;
    }
  }

  public getSubmissions(): Map<string, { submissionId: string; status: KybStatus; submittedAt: Date }> {
    return new Map(this.submissions);
  }
}