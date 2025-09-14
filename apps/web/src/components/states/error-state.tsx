'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Bug, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  type?: 'error' | 'warning' | 'network' | 'bug';
  title: string;
  description?: string;
  errorCode?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const errorIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  network: RefreshCw,
  bug: Bug,
};

const errorColors = {
  error: 'text-error',
  warning: 'text-warning',
  network: 'text-info',
  bug: 'text-error',
};

const errorBgColors = {
  error: 'bg-error/10',
  warning: 'bg-warning/10',
  network: 'bg-info/10',
  bug: 'bg-error/10',
};

export function ErrorState({
  type = 'error',
  title,
  description,
  errorCode,
  action,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const Icon = errorIcons[type];

  return (
    <Card variant="outline" className={cn('border-error/20', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full mb-4',
          errorBgColors[type]
        )}>
          <Icon className={cn('h-10 w-10', errorColors[type])} />
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          {errorCode && (
            <Badge variant="error-soft" className="text-xs">
              {errorCode}
            </Badge>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              disabled={action.loading}
              variant="default"
            >
              {action.loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}