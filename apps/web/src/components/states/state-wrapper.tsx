'use client';

import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

interface StateWrapperProps {
  loading?: boolean;
  error?: {
    type?: 'error' | 'warning' | 'network' | 'bug';
    title: string;
    description?: string;
    errorCode?: string;
    onRetry?: () => void;
    onSupport?: () => void;
  };
  empty?: {
    icon?: React.ElementType;
    title: string;
    description?: string;
    onAction?: () => void;
    actionLabel?: string;
    onSecondaryAction?: () => void;
    secondaryActionLabel?: string;
  };
  data?: any[];
  loadingType?: 'spinner' | 'skeleton' | 'pulse';
  loadingTitle?: string;
  loadingDescription?: string;
  children: React.ReactNode;
  className?: string;
}

export function StateWrapper({
  loading,
  error,
  empty,
  data,
  loadingType = 'skeleton',
  loadingTitle,
  loadingDescription,
  children,
  className,
}: StateWrapperProps) {
  // Show loading state
  if (loading) {
    return (
      <LoadingState
        type={loadingType}
        title={loadingTitle}
        description={loadingDescription}
        className={className}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        type={error.type}
        title={error.title}
        description={error.description}
        errorCode={error.errorCode}
        action={error.onRetry ? {
          label: 'Try Again',
          onClick: error.onRetry,
        } : undefined}
        secondaryAction={error.onSupport ? {
          label: 'Contact Support',
          onClick: error.onSupport,
        } : undefined}
        className={className}
      />
    );
  }

  // Show empty state
  if (empty && (!data || data.length === 0)) {
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.onAction ? {
          label: empty.actionLabel || 'Get Started',
          onClick: empty.onAction,
        } : undefined}
        secondaryAction={empty.onSecondaryAction ? {
          label: empty.secondaryActionLabel || 'Learn More',
          onClick: empty.onSecondaryAction,
          variant: 'outline',
        } : undefined}
        className={className}
      />
    );
  }

  // Render children when there's data
  return <>{children}</>;
}