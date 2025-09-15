'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Store, Settings } from 'lucide-react';
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

  const handleToggle = (isPlatform: boolean) => {
    const newType: TenantType = isPlatform ? 'platform' : 'merchant';
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
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Tenant Type
            </Label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Switch between merchant and platform views
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Store className={`h-4 w-4 ${tenantType === 'merchant' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${tenantType === 'merchant' ? 'font-medium' : 'text-gray-500'}`}>
                Merchant
              </span>
            </div>

            <Switch
              checked={tenantType === 'platform'}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-blue-600"
            />

            <div className="flex items-center space-x-2">
              <Building className={`h-4 w-4 ${tenantType === 'platform' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${tenantType === 'platform' ? 'font-medium' : 'text-gray-500'}`}>
                Platform
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 border-t pt-2">
            <strong>Current:</strong> {tenantType === 'platform' ? 'Platform Admin' : 'Merchant User'}
            <br />
            <strong>Features:</strong> {tenantType === 'platform' ? 'Multi-tenant management' : 'Single merchant tools'}
          </div>
        </div>
      </Card>
    </div>
  );
}