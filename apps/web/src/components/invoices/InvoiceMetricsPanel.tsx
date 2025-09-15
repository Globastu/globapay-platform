'use client';

import { Invoice } from '@/lib/contracts/invoices';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';

interface InvoiceMetricsPanelProps {
  invoices: Invoice[];
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, trend, icon, description }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function InvoiceMetricsPanel({ invoices }: InvoiceMetricsPanelProps) {
  const calculateMetrics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Filter invoices by status and due date
    const openInvoices = invoices.filter(inv => inv.status === 'open');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const draftInvoices = invoices.filter(inv => inv.status === 'draft');
    
    const overdueInvoices = openInvoices.filter(inv => new Date(inv.dueDate) < today);
    const dueTodayInvoices = openInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate.toDateString() === today.toDateString();
    });
    const dueSoonInvoices = openInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 && daysDiff <= 7;
    });
    
    // Calculate totals
    const totalOutstanding = openInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalDueToday = dueTodayInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    
    // Calculate collection rate (paid vs total)
    const totalInvoiced = invoices
      .filter(inv => inv.status !== 'draft' && inv.status !== 'void')
      .reduce((sum, inv) => sum + inv.total, 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
    
    // Format currency
    const formatCurrency = (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount / 100);
    };

    return {
      totalOutstanding: formatCurrency(totalOutstanding),
      totalOverdue: formatCurrency(totalOverdue),
      totalPaid: formatCurrency(totalPaid),
      totalDueToday: formatCurrency(totalDueToday),
      overdueCount: overdueInvoices.length,
      dueTodayCount: dueTodayInvoices.length,
      dueSoonCount: dueSoonInvoices.length,
      draftCount: draftInvoices.length,
      collectionRate: collectionRate.toFixed(1),
      totalInvoices: invoices.length,
      openInvoicesCount: openInvoices.length,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invoice Overview</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Key metrics and performance indicators for your invoicing
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Outstanding Amount"
          value={metrics.totalOutstanding}
          icon={<DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          description={`${metrics.openInvoicesCount} open invoices`}
        />
        
        <MetricCard
          title="Overdue"
          value={metrics.totalOverdue}
          change={`${metrics.overdueCount} invoices`}
          trend={metrics.overdueCount > 0 ? 'down' : 'neutral'}
          icon={<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
        
        <MetricCard
          title="Due Today"
          value={metrics.totalDueToday}
          change={`${metrics.dueTodayCount} invoices`}
          trend={metrics.dueTodayCount > 0 ? 'neutral' : 'up'}
          icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        />
        
        <MetricCard
          title="Collection Rate"
          value={`${metrics.collectionRate}%`}
          change={parseFloat(metrics.collectionRate) > 85 ? 'Excellent' : parseFloat(metrics.collectionRate) > 70 ? 'Good' : 'Needs Improvement'}
          trend={parseFloat(metrics.collectionRate) > 85 ? 'up' : parseFloat(metrics.collectionRate) > 70 ? 'neutral' : 'down'}
          icon={<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalInvoices}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.dueSoonCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Due Next 7 Days</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{metrics.draftCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Draft Invoices</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.totalPaid}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
          </div>
        </Card>
      </div>
    </div>
  );
}