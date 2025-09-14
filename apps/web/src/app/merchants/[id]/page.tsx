'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Shield,
  FileText,
  Users,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import type { Merchant, KybStepStatus, MerchantOnboardingProgress } from '@/types/tenancy';

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.id as string;
  
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [progress, setProgress] = useState<MerchantOnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (merchantId) {
      loadMerchantData();
    }
  }, [merchantId]);

  const loadMerchantData = async () => {
    try {
      setLoading(true);
      
      // Load merchant details
      const merchantResponse = await fetch(`/api/merchants/${merchantId}`);
      if (merchantResponse.ok) {
        const merchantData = await merchantResponse.json();
        setMerchant(merchantData.data);
        
        // Generate progress based on merchant data
        const progressData = generateOnboardingProgress(merchantData.data);
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Failed to load merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOnboardingProgress = (merchant: Merchant): MerchantOnboardingProgress => {
    const steps: KybStepStatus[] = [
      {
        step: 'basic_info',
        name: 'Basic Information',
        status: merchant.name && merchant.email ? 'completed' : 'current',
        description: 'Company name, contact information, and business address'
      },
      {
        step: 'business_details',
        name: 'Business Details',
        status: merchant.kybData?.businessType ? 'completed' : 
                merchant.name && merchant.email ? 'current' : 'upcoming',
        description: 'Business type, tax ID, and incorporation details'
      },
      {
        step: 'documents',
        name: 'Document Upload',
        status: merchant.kybData?.documents && merchant.kybData.documents.length > 0 ? 'completed' :
                merchant.kybData?.businessType ? 'current' : 'upcoming',
        description: 'Upload required business documents and certificates'
      },
      {
        step: 'owners',
        name: 'Business Owners',
        status: merchant.kybData?.owners && merchant.kybData.owners.length > 0 ? 'completed' :
                merchant.kybData?.documents && merchant.kybData.documents.length > 0 ? 'current' : 'upcoming',
        description: 'Information about business owners and stakeholders'
      },
      {
        step: 'banking',
        name: 'Bank Account',
        status: merchant.kybData?.bankAccount ? 'completed' :
                merchant.kybData?.owners && merchant.kybData.owners.length > 0 ? 'current' : 'upcoming',
        description: 'Bank account details for payment processing'
      },
      {
        step: 'review',
        name: 'Review & Approval',
        status: merchant.kybStatus === 'approved' ? 'completed' :
                merchant.kybStatus === 'rejected' ? 'blocked' :
                merchant.kybStatus === 'under_review' ? 'current' :
                merchant.kybData?.bankAccount ? 'current' : 'upcoming',
        description: 'Final review and approval by our compliance team'
      }
    ];

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const currentStepIndex = steps.findIndex(step => step.status === 'current');
    
    let estimatedTimeRemaining: string | undefined;
    const blockers: string[] = [];

    if (merchant.kybStatus === 'additional_info_required') {
      blockers.push('Additional information required');
      estimatedTimeRemaining = '1-2 business days after providing required information';
    } else if (merchant.kybStatus === 'rejected') {
      blockers.push('Application rejected - contact support for details');
    } else if (merchant.kybStatus === 'under_review') {
      estimatedTimeRemaining = '2-3 business days';
    }

    return {
      merchantId: merchant.id,
      currentStep: Math.max(currentStepIndex, 0),
      totalSteps: steps.length,
      steps,
      completionPercentage: Math.round((completedSteps / steps.length) * 100),
      ...(estimatedTimeRemaining && { estimatedTimeRemaining }),
      ...(blockers.length > 0 && { blockers }),
    };
  };

  const refreshKybStatus = async () => {
    if (!merchant?.kybData?.submittedAt) return;
    
    try {
      setRefreshing(true);
      // In a real implementation, we'd have a submission ID to check
      const submissionId = 'kyb_' + merchant.id; // Mock submission ID
      
      const response = await fetch(`/api/merchants/${merchantId}/kyb-status?submissionId=${submissionId}`);
      if (response.ok) {
        await loadMerchantData(); // Reload all data
      }
    } catch (error) {
      console.error('Failed to refresh KYB status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'blocked':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'outline';
      case 'rejected':
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getKybStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'under_review':
      case 'documents_submitted':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'additional_info_required':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Merchant not found or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{merchant.name}</h1>
            <p className="text-gray-600">
              {merchant.legalName} • ID: {merchant.id}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadgeVariant(merchant.status)}>
              {merchant.status.replace('_', ' ')}
            </Badge>
            <Badge variant={getKybStatusBadgeVariant(merchant.kybStatus)}>
              KYB: {merchant.kybStatus.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Onboarding Progress */}
      {progress && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Onboarding Progress
              </CardTitle>
              {merchant.kybData?.submittedAt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshKybStatus}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{progress.completionPercentage}% Complete</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-2" />
            </div>

            {progress.estimatedTimeRemaining && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Estimated time remaining: {progress.estimatedTimeRemaining}
                </AlertDescription>
              </Alert>
            )}

            {progress.blockers && progress.blockers.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Action Required:</div>
                  <ul className="list-disc list-inside">
                    {progress.blockers.map((blocker, index) => (
                      <li key={index}>{blocker}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {progress.steps.map((step, index) => (
                <div key={step.step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{step.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Step {index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyb">KYB Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Legal Name</label>
                  <p className="mt-1">{merchant.legalName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Description</label>
                  <p className="mt-1">{merchant.description || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Type</label>
                  <p className="mt-1 capitalize">
                    {merchant.kybData?.businessType?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{merchant.email}</span>
                </div>
                {merchant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{merchant.phone}</span>
                  </div>
                )}
                {merchant.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a href={merchant.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      {merchant.website}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <div>{merchant.address.street}</div>
                    <div>{merchant.address.city}, {merchant.address.state} {merchant.address.postalCode}</div>
                    <div>{merchant.address.country}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-gray-600">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-gray-600">
                    {new Date(merchant.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {merchant.approvedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Approved</span>
                    <span className="text-sm text-gray-600">
                      {new Date(merchant.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyb" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KYB Information</CardTitle>
            </CardHeader>
            <CardContent>
              {merchant.kybData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Type</label>
                      <p className="mt-1 capitalize">{merchant.kybData.businessType.replace('_', ' ')}</p>
                    </div>
                    {merchant.kybData.taxId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tax ID</label>
                        <p className="mt-1 font-mono">***-**-{merchant.kybData.taxId.slice(-4)}</p>
                      </div>
                    )}
                    {merchant.kybData.registrationNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Registration Number</label>
                        <p className="mt-1">{merchant.kybData.registrationNumber}</p>
                      </div>
                    )}
                    {merchant.kybData.dateOfIncorporation && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Incorporation</label>
                        <p className="mt-1">
                          {new Date(merchant.kybData.dateOfIncorporation).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {merchant.kybData.owners && merchant.kybData.owners.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Business Owners
                      </h4>
                      <div className="space-y-3">
                        {merchant.kybData.owners.map((owner, index) => (
                          <div key={owner.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                                <p className="text-sm text-gray-600">{owner.title}</p>
                                <p className="text-sm text-gray-600">{owner.email}</p>
                              </div>
                              <Badge variant="outline">
                                {owner.ownershipPercentage}% ownership
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {merchant.kybData.bankAccount && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Bank Account
                      </h4>
                      <div className="p-3 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Type</label>
                            <p className="mt-1 capitalize">{merchant.kybData.bankAccount.accountType}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Holder</label>
                            <p className="mt-1">{merchant.kybData.bankAccount.accountHolderName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Routing Number</label>
                            <p className="mt-1 font-mono">****{merchant.kybData.bankAccount.routingNumber.slice(-4)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Number</label>
                            <p className="mt-1 font-mono">****{merchant.kybData.bankAccount.accountNumber.slice(-4)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {merchant.kybData.reviewNotes && (
                    <div>
                      <h4 className="font-medium mb-2">Review Notes</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{merchant.kybData.reviewNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No KYB information submitted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {merchant.kybData?.documents && merchant.kybData.documents.length > 0 ? (
                <div className="space-y-3">
                  {merchant.kybData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {doc.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={doc.status === 'approved' ? 'success' : 
                                      doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {doc.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Merchant Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Default Currency</label>
                    <p className="mt-1">{merchant.settings.currency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timezone</label>
                    <p className="mt-1">{merchant.settings.timezone}</p>
                  </div>
                </div>
                {merchant.settings.webhookUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Webhook URL</label>
                    <p className="mt-1 font-mono text-sm break-all">{merchant.settings.webhookUrl}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}