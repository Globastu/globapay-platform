'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/charts/metric-card';
import { AreaChartComponent } from '@/components/charts/area-chart';
import { BarChartComponent } from '@/components/charts/bar-chart';
import { LineChartComponent } from '@/components/charts/line-chart';
import { PieChartComponent } from '@/components/charts/pie-chart';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Users,
  Activity
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

  // Sample chart data
  const revenueData = [
    { month: 'Jan', revenue: 4000, transactions: 240 },
    { month: 'Feb', revenue: 3000, transactions: 198 },
    { month: 'Mar', revenue: 5000, transactions: 320 },
    { month: 'Apr', revenue: 7000, transactions: 450 },
    { month: 'May', revenue: 6000, transactions: 380 },
    { month: 'Jun', revenue: 8000, transactions: 520 },
  ];

  const paymentMethodsData = [
    { name: 'Credit Card', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Bank Transfer', value: 25, color: 'hsl(var(--success))' },
    { name: 'Digital Wallet', value: 20, color: 'hsl(var(--info))' },
    { name: 'Other', value: 10, color: 'hsl(var(--warning))' },
  ];

  const dailyTransactionsData = [
    { day: 'Mon', successful: 120, failed: 5 },
    { day: 'Tue', successful: 145, failed: 8 },
    { day: 'Wed', successful: 168, failed: 3 },
    { day: 'Thu', successful: 190, failed: 7 },
    { day: 'Fri', successful: 205, failed: 4 },
    { day: 'Sat', successful: 95, failed: 2 },
    { day: 'Sun', successful: 78, failed: 1 },
  ];

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your Globapay dashboard. Monitor transactions, manage payments, and track your business metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value="$24,350"
          change={{ value: 12, type: 'increase', timeframe: 'from last month' }}
          icon={DollarSign}
          variant="success"
        />
        
        <MetricCard
          title="Transactions"
          value={1247}
          change={{ value: 8, type: 'increase', timeframe: 'from last week' }}
          icon={CreditCard}
          variant="info"
        />
        
        <MetricCard
          title="Success Rate"
          value="98.2%"
          change={{ value: 0.3, type: 'increase', timeframe: 'from yesterday' }}
          icon={CheckCircle}
          variant="success"
        />
        
        <MetricCard
          title="Active Users"
          value={342}
          change={{ value: 5, type: 'increase', timeframe: 'from last week' }}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChartComponent
              data={revenueData}
              xDataKey="month"
              yDataKey="revenue"
              color="hsl(var(--success))"
              height={250}
            />
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={paymentMethodsData}
              height={250}
              innerRadius={60}
              outerRadius={100}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Transactions */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Daily Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dailyTransactionsData}
              xDataKey="day"
              yDataKey="successful"
              color="hsl(var(--primary))"
              height={250}
            />
          </CardContent>
        </Card>

        {/* Success vs Failed Trend */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Transaction Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={dailyTransactionsData}
              xDataKey="day"
              lines={[
                { dataKey: 'successful', color: 'hsl(var(--success))', name: 'Successful' },
                { dataKey: 'failed', color: 'hsl(var(--error))', name: 'Failed' }
              ]}
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* System Monitoring & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reconciliation Status */}
        <Card variant="elevated">
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
                  <span className="text-sm text-muted-foreground">Orphaned Transactions</span>
                  <Badge variant={webhookStats.orphanedTransactions > 0 ? "error" : "success-soft"}>
                    {webhookStats.orphanedTransactions}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Missing Payment Links</span>
                  <Badge variant={webhookStats.missingPaymentLinks > 0 ? "error" : "success-soft"}>
                    {webhookStats.missingPaymentLinks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Webhook Delivery Delays</span>
                  <Badge variant={webhookStats.webhookDelayAlerts > 0 ? "error" : "success-soft"}>
                    {webhookStats.webhookDelayAlerts}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Check:</span>
                    <span>{new Date(webhookStats.lastRunAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Check:</span>
                    <span>{new Date(webhookStats.nextRunAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Loading reconciliation data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card variant="elevated">
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
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>No system alerts</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span className="font-medium">Create Payment Link</span>
              <span className="text-sm text-muted-foreground">Generate a new payment request</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="font-medium">View Transactions</span>
              <span className="text-sm text-muted-foreground">Monitor payment activity</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="font-medium">System Alerts</span>
              <span className="text-sm text-muted-foreground">Review all system issues</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}