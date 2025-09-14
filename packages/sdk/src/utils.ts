import type { GlobapayClient } from './client';
import type { ProblemDetails, ValidationProblemDetails } from './types';

export class GlobapayError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly instance?: string;

  constructor(problem: ProblemDetails) {
    super(problem.title);
    this.name = 'GlobapayError';
    this.status = problem.status;
    this.type = problem.type;
    if (problem.instance !== undefined) {
      this.instance = problem.instance;
    }
  }
}

export class GlobapayValidationError extends GlobapayError {
  public readonly errors: Record<string, string[]>;

  constructor(problem: ValidationProblemDetails) {
    super(problem);
    this.name = 'GlobapayValidationError';
    this.errors = problem.errors;
  }
}

export function isErrorResponse(response: unknown): response is ProblemDetails {
  return (
    typeof response === 'object' &&
    response !== null &&
    'type' in response &&
    'title' in response &&
    'status' in response
  );
}

export function isValidationErrorResponse(
  response: unknown
): response is ValidationProblemDetails {
  return isErrorResponse(response) && 'errors' in response;
}

export function handleErrorResponse(response: unknown): never {
  if (isValidationErrorResponse(response)) {
    throw new GlobapayValidationError(response);
  }
  
  if (isErrorResponse(response)) {
    throw new GlobapayError(response);
  }
  
  throw new Error('Unknown error response');
}

export interface IdempotentRequestOptions {
  idempotencyKey?: string;
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function withIdempotency<T extends Record<string, unknown>>(
  params: T,
  options?: IdempotentRequestOptions
): T & { headers?: Record<string, string> } {
  if (!options?.idempotencyKey) {
    return params;
  }

  return {
    ...params,
    headers: {
      ...(params.headers as Record<string, string> | undefined),
      'Idempotency-Key': options.idempotencyKey,
    },
  };
}