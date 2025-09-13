'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface ReconciliationAlert {
  id: string;
  type: 'orphaned_transaction' | 'webhook_delivery_lag' | 'missing_payment_link';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  resourceId: string;
  resourceType: string;
  createdAt: string;
}

interface WebhookStats {
  orphanedTransactions: number;
  missingPaymentLinks: number;
  webhookDelayAlerts: number;
  totalIssues: number;
  lastRunAt: string;
  nextRunAt: string;
}

export default function HomePage(): JSX.Element {
  const [alerts, setAlerts] = useState<ReconciliationAlert[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be API calls
      // For now, we'll use mock data
      
      const mockAlerts: ReconciliationAlert[] = [
        {
          id: 'alert_1',
          type: 'webhook_delivery_lag',
          severity: 'high',
          title: 'Webhook Delivery Delayed',
          description: 'PSP webhook payment.completed has failed 5 times',
          resourceId: 'webhook_123',
          resourceType: 'webhook',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'alert_2',
          type: 'orphaned_transaction',
          severity: 'medium',
          title: 'Orphaned Transaction',
          description: 'Transaction txn_abc123 has no matching payment link',
          resourceId: 'txn_abc123',
          resourceType: 'transaction',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ];

      const mockStats: WebhookStats = {
        orphanedTransactions: 2,
        missingPaymentLinks: 1,
        webhookDelayAlerts: 3,
        totalIssues: 6,
        lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        nextRunAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      setAlerts(mockAlerts);
      setWebhookStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Globapay Platform</h1>
        <p className="text-lg text-gray-600">
          Multi-tenant payments orchestration dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,350</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhookStats?.totalIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Reconciliation alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook & Reconciliation Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reconciliation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reconciliation Status
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDashboardData}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {webhookStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orphaned Transactions</span>
                  <Badge variant={webhookStats.orphanedTransactions > 0 ? "destructive" : "secondary"}>
                    {webhookStats.orphanedTransactions}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Missing Payment Links</span>
                  <Badge variant={webhookStats.missingPaymentLinks > 0 ? "destructive" : "secondary"}>
                    {webhookStats.missingPaymentLinks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Webhook Delivery Delays</span>
                  <Badge variant={webhookStats.webhookDelayAlerts > 0 ? "destructive" : "secondary"}>
                    {webhookStats.webhookDelayAlerts}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Check:</span>
                    <span>{new Date(webhookStats.lastRunAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Next Check:</span>
                    <span>{new Date(webhookStats.nextRunAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Loading reconciliation data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <Alert key={alert.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No system alerts</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span className="font-medium">Create Payment Link</span>
              <span className="text-sm text-gray-500">Generate a new payment request</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="font-medium">View Transactions</span>
              <span className="text-sm text-gray-500">Monitor payment activity</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="font-medium">System Alerts</span>
              <span className="text-sm text-gray-500">Review all system issues</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}