'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'SUCCESS' | 'FAILURE';
  details: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  failureRate: number;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const [exporting, setExporting] = useState(false);

  const fetchAuditLogs = async (pageNum = 1, resetLogs = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '50',
      });

      if (actionFilter) params.append('action', actionFilter);
      if (resourceTypeFilter) params.append('resourceType', resourceTypeFilter);
      if (outcomeFilter) params.append('outcome', outcomeFilter);
      if (userFilter) params.append('userId', userFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();

      if (resetLogs) {
        setLogs(data.logs);
      } else {
        setLogs(prev => [...prev, ...data.logs]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);

      const response = await fetch(`/api/audit-logs/stats?${params}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1, true);
    fetchStats();
  }, [actionFilter, resourceTypeFilter, outcomeFilter, userFilter, dateFromFilter, dateToFilter]);

  const handleLoadMore = () => {
    fetchAuditLogs(page + 1, false);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      
      const response = await fetch('/api/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters: {
            action: actionFilter,
            resourceType: resourceTypeFilter,
            outcome: outcomeFilter,
            userId: userFilter,
            dateFrom: dateFromFilter,
            dateTo: dateToFilter,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // In a real implementation, this would trigger a download
        alert(`Export completed! ${data.recordCount} records exported to ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setActionFilter('');
    setResourceTypeFilter('');
    setOutcomeFilter('');
    setUserFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return <User className="h-4 w-4" />;
      case 'TRANSACTION_REFUND':
        return <RefreshCw className="h-4 w-4" />;
      case 'API_KEY_CREATE':
      case 'API_KEY_REVOKE':
        return <Shield className="h-4 w-4" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'SUCCESS':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'FAILURE':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failure
          </Badge>
        );
      default:
        return <Badge variant="secondary">{outcome}</Badge>;
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatResourceType = (resourceType: string) => {
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Security and compliance audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAuditLogs(1, true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold">{(stats.eventsByOutcome.SUCCESS || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold">{(stats.eventsByOutcome.FAILURE || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failure Rate</p>
                  <p className="text-2xl font-bold">{stats.failureRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="export">Export & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All actions</SelectItem>
                      <SelectItem value="USER_LOGIN">User Login</SelectItem>
                      <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                      <SelectItem value="PAYMENT_LINK_CREATE">Payment Link Create</SelectItem>
                      <SelectItem value="TRANSACTION_REFUND">Transaction Refund</SelectItem>
                      <SelectItem value="API_KEY_CREATE">API Key Create</SelectItem>
                      <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="PAYMENT_LINK">Payment Link</SelectItem>
                      <SelectItem value="TRANSACTION">Transaction</SelectItem>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="MERCHANT">Merchant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="outcome">Outcome</Label>
                  <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All outcomes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All outcomes</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="FAILURE">Failure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <div>
                          <p className="font-medium">{formatAction(log.action)}</p>
                          <p className="text-sm text-gray-600">
                            {formatResourceType(log.resourceType)} • {log.resourceId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium">{log.user.name}</p>
                          <p className="text-xs text-gray-600">{log.user.email}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                          </p>
                          {log.details?.ipAddress && (
                            <p className="text-xs text-gray-600">IP: {log.details.ipAddress}</p>
                          )}
                        </div>

                        {getOutcomeBadge(log.outcome)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {log.errorMessage && (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Error
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}

                {logs.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
                    <p className="text-gray-600">Try adjusting your filters or date range.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Export audit logs for compliance, reporting, or external analysis. 
                  Current filters will be applied to the export.
                </p>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                </div>

                {exporting && (
                  <p className="text-sm text-gray-600">
                    Preparing export... This may take a few moments.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Audit Log Details</h2>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <p className="font-medium">{formatAction(selectedLog.action)}</p>
                </div>
                <div>
                  <Label>Outcome</Label>
                  {getOutcomeBadge(selectedLog.outcome)}
                </div>
                <div>
                  <Label>Resource Type</Label>
                  <p>{formatResourceType(selectedLog.resourceType)}</p>
                </div>
                <div>
                  <Label>Resource ID</Label>
                  <p className="font-mono text-sm">{selectedLog.resourceId}</p>
                </div>
                <div>
                  <Label>User</Label>
                  <p>{selectedLog.user.name} ({selectedLog.user.email})</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p>{format(new Date(selectedLog.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <Label>Error Message</Label>
                  <p className="text-red-600 bg-red-50 p-2 rounded border">{selectedLog.errorMessage}</p>
                </div>
              )}

              <div>
                <Label>Details</Label>
                <pre className="bg-gray-50 p-4 rounded border text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {selectedLog.metadata && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="bg-gray-50 p-4 rounded border text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}