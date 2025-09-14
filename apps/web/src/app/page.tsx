'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CreditCard,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Gift
} from 'lucide-react';
import { AreaChartComponent } from '@/components/charts/area-chart';
import { BarChartComponent } from '@/components/charts/bar-chart';

interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
}

interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats([
        {
          title: 'Revenue Today',
          value: '$12,426',
          change: '+8.2%',
          changeType: 'increase',
          icon: DollarSign,
        },
        {
          title: 'Volume This Month',
          value: '2,847',
          change: '+15.3%',
          changeType: 'increase',
          icon: TrendingUp,
        },
        {
          title: 'Active Merchants',
          value: '127',
          change: '+2',
          changeType: 'increase',
          icon: Users,
        },
        {
          title: 'Alerts',
          value: '3',
          change: '-1',
          changeType: 'decrease',
          icon: AlertTriangle,
        },
      ]);

      setRecentTransactions([
        {
          id: 'txn_1234567890',
          merchantName: 'Acme Corp',
          amount: 299.99,
          currency: 'USD',
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'txn_1234567891',
          merchantName: 'Tech Solutions Ltd',
          amount: 1299.00,
          currency: 'USD',
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'txn_1234567892',
          merchantName: 'Digital Services Inc',
          amount: 49.99,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'txn_1234567893',
          merchantName: 'E-commerce Store',
          amount: 89.99,
          currency: 'USD',
          status: 'failed',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'txn_1234567894',
          merchantName: 'Online Marketplace',
          amount: 199.99,
          currency: 'USD',
          status: 'completed',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Sample chart data
  const revenueData = [
    { date: '2024-01-01', revenue: 4000 },
    { date: '2024-01-02', revenue: 3000 },
    { date: '2024-01-03', revenue: 5000 },
    { date: '2024-01-04', revenue: 7000 },
    { date: '2024-01-05', revenue: 6000 },
    { date: '2024-01-06', revenue: 8000 },
    { date: '2024-01-07', revenue: 9000 },
  ];

  const volumeData = [
    { date: '2024-01-01', volume: 120 },
    { date: '2024-01-02', volume: 98 },
    { date: '2024-01-03', volume: 156 },
    { date: '2024-01-04', volume: 187 },
    { date: '2024-01-05', volume: 134 },
    { date: '2024-01-06', volume: 210 },
    { date: '2024-01-07', volume: 243 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to your Globapay dashboard
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          View Reports
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-1">
                      {stat.changeType === 'increase' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'increase' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                        vs last period
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChartComponent
              data={revenueData}
              xDataKey="date"
              yDataKey="revenue"
              color="hsl(173, 100%, 36%)"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={volumeData}
              xDataKey="date"
              yDataKey="volume"
              color="hsl(158, 64%, 52%)"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.merchantName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.id} • {formatTime(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GlobaGift Section - only show if enabled */}
      {process.env.NEXT_PUBLIC_GLOBAGIFT_ENABLED === '1' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              Gift Card Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cards Sold</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">$2,350</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Redemption Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}