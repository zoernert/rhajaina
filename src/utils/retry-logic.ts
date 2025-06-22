export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryCondition = () => true
  } = config;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts || !retryCondition(error)) {
        break;
      }

      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter);
      await sleep(delay);
    }
  }

  throw new RetryError(
    `Operation failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError!
  );
}

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  delay = Math.min(delay, maxDelay);

  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}
