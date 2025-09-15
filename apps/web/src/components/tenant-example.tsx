'use client';

import { useTenant } from '@/hooks/use-tenant';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building, Shield, Settings } from 'lucide-react';

/**
 * Example component demonstrating the tenant-based access control system
 * This shows how different UI elements and functionality are displayed
 * based on whether the user is a platform or merchant tenant
 */
export function TenantExampleComponent() {
  const {
    tenantInfo,
    isLoading,
    isPlatform,
    isMerchant,
    canManageMerchants,
    canManageUsers,
    canAccessPlatformSettings,
    canViewAllTransactions,
    canAccessFraudManagement,
    labels,
    getPageTitle
  } = useTenant();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!tenantInfo) {
    return (
      <Card className="p-6">
        <p className="text-red-600">No tenant information available. Please log in.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tenant Information</h2>
          <Badge variant={isPlatform ? 'default' : 'secondary'}>
            {tenantInfo.type === 'platform' ? 'Platform' : 'Merchant'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Type:</strong> {tenantInfo.type}
          </div>
          <div>
            <strong>Organization ID:</strong> {tenantInfo.organizationId}
          </div>
          {tenantInfo.merchantId && (
            <div>
              <strong>Merchant ID:</strong> {tenantInfo.merchantId}
            </div>
          )}
          <div>
            <strong>Page Title:</strong> {getPageTitle('Dashboard')}
          </div>
        </div>
      </Card>

      {/* Permissions Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Access Permissions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <PermissionCard
            icon={<Users className="h-5 w-5" />}
            title="Manage Merchants"
            hasPermission={canManageMerchants}
            description="Add, edit, and manage merchant accounts"
          />
          <PermissionCard
            icon={<Users className="h-5 w-5" />}
            title="Manage Users"
            hasPermission={canManageUsers}
            description="Manage user accounts and permissions"
          />
          <PermissionCard
            icon={<Building className="h-5 w-5" />}
            title="Platform Settings"
            hasPermission={canAccessPlatformSettings}
            description="Access platform-wide configuration"
          />
          <PermissionCard
            icon={<Shield className="h-5 w-5" />}
            title="Fraud Management"
            hasPermission={canAccessFraudManagement}
            description="Access fraud detection and prevention tools"
          />
          <PermissionCard
            icon={<Settings className="h-5 w-5" />}
            title="View All Transactions"
            hasPermission={canViewAllTransactions}
            description="View transactions across all merchants"
          />
        </div>
      </Card>

      {/* Conditional Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Features</h3>
        <div className="space-y-3">
          
          {/* Platform-only features */}
          {isPlatform && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Platform Features
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Merchant onboarding and management</li>
                <li>• Global transaction monitoring</li>
                <li>• Platform-wide analytics and reporting</li>
                <li>• Multi-tenant configuration</li>
                {canAccessFraudManagement && <li>• Advanced fraud prevention</li>}
              </ul>
            </div>
          )}

          {/* Merchant-only features */}
          {isMerchant && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                Merchant Features
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                <li>• Own transaction management</li>
                <li>• Payment link creation</li>
                <li>• Invoice management</li>
                <li>• Checkout builder</li>
                <li>• Merchant-specific reporting</li>
              </ul>
            </div>
          )}

          {/* Common features */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-2">
              Shared Features
            </h4>
            <ul className="text-sm text-gray-800 dark:text-gray-400 space-y-1">
              <li>• Payment processing</li>
              <li>• Transaction reporting</li>
              <li>• Account settings</li>
              <li>• API access</li>
              <li>• Webhook configuration</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Action Buttons - Contextual based on tenant type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {canManageMerchants && (
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add Merchant
            </Button>
          )}
          {canAccessPlatformSettings && (
            <Button variant="outline">
              <Building className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          )}
          {isMerchant && (
            <>
              <Button>Create Payment Link</Button>
              <Button variant="outline">Generate Invoice</Button>
            </>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            {labels.settingsLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  hasPermission: boolean;
  description: string;
}

function PermissionCard({ icon, title, hasPermission, description }: PermissionCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${
      hasPermission 
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }`}>
      <div className="flex items-center mb-2">
        <div className={`mr-2 ${
          hasPermission 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-400'
        }`}>
          {icon}
        </div>
        <h4 className={`font-medium text-sm ${
          hasPermission 
            ? 'text-green-900 dark:text-green-300' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {title}
        </h4>
      </div>
      <p className={`text-xs ${
        hasPermission 
          ? 'text-green-700 dark:text-green-400' 
          : 'text-gray-500'
      }`}>
        {description}
      </p>
      <div className="mt-2">
        <Badge 
          variant={hasPermission ? 'default' : 'secondary'}
          className="text-xs"
        >
          {hasPermission ? 'Allowed' : 'Restricted'}
        </Badge>
      </div>
    </div>
  );
}