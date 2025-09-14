'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    timeframe?: string;
  };
  icon?: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variantStyles = {
  default: '',
  success: 'border-success/20 bg-success/5',
  warning: 'border-warning/20 bg-warning/5',
  error: 'border-error/20 bg-error/5',
  info: 'border-info/20 bg-info/5',
};

const variantIconColors = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
};

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = 'default',
  className 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card variant="elevated" className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", variantIconColors[variant])} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change && (
          <div className="flex items-center text-xs mt-1">
            {change.type === 'increase' ? (
              <TrendingUp className="h-3 w-3 text-success mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-error mr-1" />
            )}
            <span className={cn(
              "font-medium",
              change.type === 'increase' ? "text-success" : "text-error"
            )}>
              {change.type === 'increase' ? '+' : ''}{change.value}%
            </span>
            {change.timeframe && (
              <span className="text-muted-foreground ml-1">
                {change.timeframe}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}