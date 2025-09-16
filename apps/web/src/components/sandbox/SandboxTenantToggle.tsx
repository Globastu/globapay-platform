'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Store, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSandboxMode, getSandboxTenantType, setSandboxTenantType, type TenantType } from '@/lib/sandbox';

export function SandboxTenantToggle() {
  const [isVisible, setIsVisible] = useState(false);
  const [tenantType, setTenantType] = useState<TenantType>('merchant');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsVisible(isSandboxMode());
    if (isSandboxMode()) {
      setTenantType(getSandboxTenantType());
    }
  }, []);

  useEffect(() => {
    // Listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globapay-sandbox-tenant-type' && e.newValue) {
        setTenantType(e.newValue as TenantType);
        // Trigger page reload to update navigation
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTenantChange = (newType: TenantType) => {
    setTenantType(newType);
    setSandboxTenantType(newType);
    
    // Reload the page to update the navigation and session
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (!isVisible) {
    return null;
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Sandbox
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 shadow-lg border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              SANDBOX MODE
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Tenant Type
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Switch between admin, platform, and merchant views
            </p>
          </div>

          <div className="space-y-2">
            {/* Admin Option */}
            <button
              onClick={() => handleTenantChange('admin')}
              className={`w-full p-2 rounded border text-left transition-colors ${
                tenantType === 'admin' 
                  ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className={`h-4 w-4 ${tenantType === 'admin' ? 'text-red-600' : 'text-gray-400'}`} />
                <div>
                  <span className={`text-sm ${tenantType === 'admin' ? 'font-medium text-red-900 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Admin (Globapay Staff)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Onboard platforms & merchants
                  </p>
                </div>
              </div>
            </button>

            {/* Platform Option */}
            <button
              onClick={() => handleTenantChange('platform')}
              className={`w-full p-2 rounded border text-left transition-colors ${
                tenantType === 'platform' 
                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className={`h-4 w-4 ${tenantType === 'platform' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <span className={`text-sm ${tenantType === 'platform' ? 'font-medium text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Platform Partner
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Onboard merchants & billing
                  </p>
                </div>
              </div>
            </button>

            {/* Merchant Option */}
            <button
              onClick={() => handleTenantChange('merchant')}
              className={`w-full p-2 rounded border text-left transition-colors ${
                tenantType === 'merchant' 
                  ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Store className={`h-4 w-4 ${tenantType === 'merchant' ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <span className={`text-sm ${tenantType === 'merchant' ? 'font-medium text-green-900 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    Merchant
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Payment functionality
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 border-t pt-2">
            <strong>Current:</strong> {
              tenantType === 'admin' ? 'Globapay Admin' :
              tenantType === 'platform' ? 'Platform Partner' : 'Merchant User'
            }
          </div>
        </div>
      </Card>
    </div>
  );
}