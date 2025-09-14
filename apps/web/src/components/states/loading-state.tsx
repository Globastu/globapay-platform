'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse';
  title?: string;
  description?: string;
  lines?: number;
  className?: string;
}

export function LoadingState({
  type = 'skeleton',
  title,
  description,
  lines = 3,
  className,
}: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <Card variant="ghost" className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          {title && (
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground max-w-sm">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === 'pulse') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              {Array.from({ length: lines }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 bg-muted rounded",
                    i === lines - 1 ? "w-1/2" : "w-full"
                  )}
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Skeleton type (default)
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {title && <Skeleton className="h-6 w-3/4" />}
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-4",
                  i === lines - 1 ? "w-1/2" : "w-full"
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table loading skeleton
export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart loading skeleton
export function ChartLoadingSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center space-x-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted animate-pulse rounded-t"
            style={{
              width: '20px',
              height: `${Math.random() * 80 + 20}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-center space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}