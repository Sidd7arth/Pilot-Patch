// packages/qloo-client/src/circuit-breaker.ts

export type BreakerState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private state: BreakerState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    public readonly failureThreshold: number = 5,
    public readonly cooldownMs: number = 30000,
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    const now = Date.now();
    if (this.state === 'open') {
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half_open';
        return true;
      }
      return false;
    }

    // Half open: allow one test execution
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): BreakerState {
    // Check if cooldown has elapsed while open
    if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.cooldownMs) {
      this.state = 'half_open';
    }
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}
