// packages/qloo-client/src/semaphore.ts

export class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(public readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.current < this.max) {
      this.current++;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.release();
        }
      };
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.release();
          }
        });
      });
    });
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.current = Math.max(0, this.current - 1);
    }
  }

  get activeCount(): number {
    return this.current;
  }

  get waitingCount(): number {
    return this.queue.length;
  }
}
