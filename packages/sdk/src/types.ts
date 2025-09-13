// Re-export types from generated OpenAPI types
export type {
  components,
  paths,
  operations,
} from './generated/types';

// Common utility types
export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors: Record<string, string[]>;
}