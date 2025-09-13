'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield,
  FileText,
  Key,
  Bell,
  Users,
  Building,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

interface SettingSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permissions?: string[];
  roles?: string[];
}

const settingSections: SettingSection[] = [
  {
    title: 'Audit Logs',
    description: 'View security and compliance audit trail',
    icon: FileText,
    href: '/settings/audit',
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  },
  {
    title: 'API Keys',
    description: 'Manage API keys for integrations',
    icon: Key,
    href: '/api-keys',
    permissions: ['API_KEYS_READ'],
  },
  {
    title: 'Security',
    description: 'Security settings and fraud detection',
    icon: Shield,
    href: '/settings/security',
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
  {
    title: 'Notifications',
    description: 'Configure webhook and email notifications',
    icon: Bell,
    href: '/settings/notifications',
    permissions: ['WEBHOOKS_READ'],
  },
  {
    title: 'Team Management',
    description: 'Manage users and permissions',
    icon: Users,
    href: '/users',
    permissions: ['USERS_READ'],
  },
  {
    title: 'Organization',
    description: 'Organization settings and billing',
    icon: Building,
    href: '/settings/organization',
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
];

export default function SettingsPage() {
  // In a real implementation, this would come from the user session
  const userRole = 'Admin'; // Mock role
  const userPermissions = ['API_KEYS_READ', 'WEBHOOKS_READ', 'USERS_READ']; // Mock permissions

  const hasAccess = (section: SettingSection): boolean => {
    // If no restrictions, allow access
    if (!section.permissions && !section.roles) {
      return true;
    }

    // Check role-based access
    if (section.roles && !section.roles.includes(userRole)) {
      return false;
    }

    // Check permission-based access
    if (section.permissions && !section.permissions.some(p => userPermissions.includes(p))) {
      return false;
    }

    return true;
  };

  const accessibleSections = settingSections.filter(hasAccess);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and application settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <section.icon className="h-6 w-6 text-blue-600" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {accessibleSections.length === 0 && (
        <div className="text-center py-12">
          <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No settings available</h3>
          <p className="text-gray-600">You don't have access to any settings sections.</p>
        </div>
      )}
    </div>
  );
}