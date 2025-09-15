'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Eye
} from 'lucide-react';

interface FraudStats {
  totalChecks: number;
  approvedCount: number;
  reviewCount: number;
  declinedCount: number;
  averageScore: number;
  averageProcessingTime: number;
  scoreDistribution: Array<{
    scoreRange: string;
    count: number;
    percentage: string;
  }>;
  topRiskFactors: Array<{
    factor: string;
    count: number;
    averageScore: number;
  }>;
}

interface HighRiskTransaction {
  id: string;
  amount: number;
  currency: string;
  fraudScore: number;
  fraudDecision: string;
  customerEmail: string;
  createdAt: string;
  status: string;
  riskFactors: string[];
}

export default function FraudPage() {
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [highRiskTransactions, setHighRiskTransactions] = useState<HighRiskTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, transactionsResponse] = await Promise.all([
          fetch('/api/fraud/stats'),
          fetch('/api/fraud/high-risk-transactions?limit=20')
        ]);

        const statsData = await statsResponse.json();
        const transactionsData = await transactionsResponse.json();

        setStats(statsData);
        setHighRiskTransactions(transactionsData.data);
      } catch (error) {
        console.error('Failed to fetch fraud data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load fraud data</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const decisionData = [
    { name: 'Approved', value: stats.approvedCount, color: '#10b981' },
    { name: 'Review', value: stats.reviewCount, color: '#f59e0b' },
    { name: 'Declined', value: stats.declinedCount, color: '#ef4444' },
  ];

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'approve':
        return 'default';
      case 'review':
        return 'secondary';
      case 'decline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const formatRiskFactor = (factor: string) => {
    return factor
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fraud Detection</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze fraud detection patterns</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Activity className="h-3 w-3 mr-1" />
          System Active
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold">{stats.totalChecks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {((stats.approvedCount / stats.totalChecks) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold">{stats.reviewCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {((stats.reviewCount / stats.totalChecks) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Declined</p>
                <p className="text-2xl font-bold">{stats.declinedCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {((stats.declinedCount / stats.totalChecks) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scoreRange" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Decision Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Decision Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={decisionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {decisionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topRiskFactors.map((factor, index) => (
                  <div key={factor.factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{formatRiskFactor(factor.factor)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{factor.count} occurrences</span>
                      <span>Avg score: {factor.averageScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  High Risk Transactions
                </CardTitle>
                <Badge variant="destructive">
                  {highRiskTransactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highRiskTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{formatAmount(transaction.amount, transaction.currency)}</p>
                          <p className="text-sm text-gray-600">{transaction.customerEmail}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={getDecisionBadgeVariant(transaction.fraudDecision)}
                          >
                            {transaction.fraudDecision}
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Score: {transaction.fraudScore}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {transaction.riskFactors.map((factor) => (
                          <Badge key={factor} variant="secondary" className="text-xs">
                            {formatRiskFactor(factor)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{transaction.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Risk level: Low</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                    <p className="text-2xl font-bold">{stats.averageProcessingTime}ms</p>
                    <p className="text-xs text-gray-500">Performance: Good</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Block Rate</p>
                    <p className="text-2xl font-bold">
                      {((stats.declinedCount / stats.totalChecks) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Security level: High</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.scoreDistribution
                      .filter((item) => parseInt(item.scoreRange.split('-')[0] || '0') < 30)
                      .reduce((sum, item) => sum + item.count, 0)}
                  </p>
                  <p className="text-sm text-green-700">Low Risk (0-29)</p>
                  <p className="text-xs text-gray-600">Safe to approve</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.scoreDistribution
                      .filter((item) => {
                        const start = parseInt(item.scoreRange.split('-')[0] || '0');
                        return start >= 30 && start <= 69;
                      })
                      .reduce((sum, item) => sum + item.count, 0)}
                  </p>
                  <p className="text-sm text-yellow-700">Medium Risk (30-69)</p>
                  <p className="text-xs text-gray-600">Requires review</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.scoreDistribution
                      .filter((item) => parseInt(item.scoreRange.split('-')[0] || '0') >= 70)
                      .reduce((sum, item) => sum + item.count, 0)}
                  </p>
                  <p className="text-sm text-red-700">High Risk (70+)</p>
                  <p className="text-xs text-gray-600">Auto-decline recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}