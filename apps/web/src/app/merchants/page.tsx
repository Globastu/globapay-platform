'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Eye, 
  Building,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Merchant, Platform, MerchantFilters } from '@/types/tenancy';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalMerchants, setTotalMerchants] = useState(0);

  // Current user role (in real app, this would come from auth context)
  const [userRole] = useState<'PLATFORM_ADMIN' | 'MERCHANT_ADMIN'>('PLATFORM_ADMIN');

  const [filters, setFilters] = useState<MerchantFilters>({
    platformId: '',
    status: 'all',
    kybStatus: 'all',
    search: '',
    page: 1,
    limit: 20,
  });

  const [stats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    pendingApproval: 0,
    averageOnboardingTime: '4.2 days',
  });

  useEffect(() => {
    loadMerchants();
    if (userRole === 'PLATFORM_ADMIN') {
      loadPlatforms();
    }
  }, [filters, userRole]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.platformId && filters.platformId !== 'all') {
        params.append('platformId', filters.platformId);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/merchants?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.data || []);
        setTotalMerchants(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const handleFilterChange = (key: keyof MerchantFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMerchants();
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
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
        return 'success';
      case 'under_review':
      case 'documents_submitted':
        return 'warning';
      case 'rejected':
        return 'destructive';
      case 'additional_info_required':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalPages = Math.ceil(totalMerchants / filters.limit);
  const canViewAllMerchants = userRole === 'PLATFORM_ADMIN';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {canViewAllMerchants ? 'All Merchants' : 'My Merchant Account'}
            </h1>
            <p className="text-gray-600">
              {canViewAllMerchants 
                ? 'Manage and monitor merchant onboarding across all platforms' 
                : 'View your merchant account status and onboarding progress'
              }
            </p>
          </div>
          {canViewAllMerchants && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Merchant
            </Button>
          )}
        </div>
      </div>

      {/* Stats Dashboard - Only for platform admins */}
      {canViewAllMerchants && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMerchants}</div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeMerchants}</div>
              <p className="text-xs text-muted-foreground">
                Fully onboarded
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Onboarding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageOnboardingTime}</div>
              <p className="text-xs text-muted-foreground">
                Time to approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {canViewAllMerchants ? 'Merchant Directory' : 'Account Overview'}
            </CardTitle>
            {canViewAllMerchants && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            )}
          </div>
        </CardHeader>

        {canViewAllMerchants && showFilters && (
          <CardContent className="border-b">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search merchants..."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={filters.platformId} onValueChange={(value) => handleFilterChange('platformId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      <SelectItem value="">Standalone</SelectItem>
                      {platforms.map(platform => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="kybStatus">KYB Status</Label>
                  <Select value={filters.kybStatus} onValueChange={(value) => handleFilterChange('kybStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All KYB statuses</SelectItem>
                      <SelectItem value="not_started">Not started</SelectItem>
                      <SelectItem value="pending_documents">Pending documents</SelectItem>
                      <SelectItem value="under_review">Under review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  {canViewAllMerchants && <TableHead>Platform</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>KYB Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </TableCell>
                      {canViewAllMerchants && (
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : merchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canViewAllMerchants ? 6 : 5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No merchants found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  merchants.map((merchant) => (
                    <TableRow key={merchant.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{merchant.name}</div>
                          <div className="text-sm text-gray-500">{merchant.email}</div>
                        </div>
                      </TableCell>
                      {canViewAllMerchants && (
                        <TableCell>
                          {merchant.platformId ? (
                            <span className="text-sm">
                              {platforms.find(p => p.id === merchant.platformId)?.name || 'Unknown'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Standalone</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(merchant.status)}
                          <Badge variant={getStatusBadgeVariant(merchant.status)}>
                            {merchant.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getKybStatusBadgeVariant(merchant.kybStatus)}>
                          {merchant.kybStatus.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(merchant.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/merchants/${merchant.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && merchants.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalMerchants)} of {totalMerchants} merchants
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, filters.page - 2);
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === filters.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}