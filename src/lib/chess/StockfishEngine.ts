/**
 * StockfishEngine — controller for the Stockfish WASM Web Worker.
 * Promise-based UCI interface. Browser-only (uses Worker + postMessage).
 */
export class StockfishEngine {
  private worker: Worker | null = null;
  private pendingResolve: ((value: string) => void) | null = null;
  private pendingReject: ((reason: Error) => void) | null = null;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private readyResolve: (() => void) | null = null;
  private destroyed = false;

  /** Initialize the Worker and wait for UCI readiness. */
  async init(): Promise<void> {
    if (this.destroyed) throw new Error("Engine destroyed");

    this.worker = new Worker("/stockfish/stockfish.js");

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Stockfish init timeout")), 15000);

      this.worker!.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : String(e.data);
        if (line.includes("uciok")) {
          clearTimeout(timeout);
          // Re-assign the message handler to the normal one
          this.worker!.onmessage = this.onMessage.bind(this);
          resolve();
        }
      };

      this.worker!.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`Stockfish worker error: ${err.message}`));
      };

      this.worker!.postMessage("uci");
    });
  }

  /** Set engine skill level (0-20). Waits for readyok confirmation. */
  async setSkill(level: number): Promise<void> {
    if (this.destroyed || !this.worker) return;
    this.send(`setoption name Skill Level value ${level}`);
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.readyResolve = null;
        reject(new Error("setSkill timeout (3s)"));
      }, 3000);
      this.readyResolve = () => {
        clearTimeout(timeout);
        this.readyResolve = null;
        resolve();
      };
      this.send("isready");
    });
  }

  /** Get the best move for a given FEN position. */
  async bestMove(fen: string, depth: number): Promise<string> {
    if (this.destroyed || !this.worker) throw new Error("Engine not ready");

    // Cancel any pending search
    if (this.pendingResolve) {
      this.stop();
      this.clearPending("Search cancelled");
    }

    return new Promise<string>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      this.pendingTimeout = setTimeout(() => {
        this.stop();
        this.clearPending("Stockfish bestMove timeout (10s)");
      }, 10000);

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /** Evaluate a position in centipawns (from side-to-move's perspective). */
  async evaluate(fen: string, depth: number): Promise<number> {
    if (this.destroyed || !this.worker) throw new Error("Engine not ready");

    if (this.pendingResolve) {
      this.stop();
      this.clearPending("Search cancelled");
    }

    return new Promise<number>((resolve, reject) => {
      let lastEval = 0;

      const originalOnMessage = this.worker!.onmessage;
      this.worker!.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : String(e.data);

        // Parse "info ... score cp X ..." or "info ... score mate X ..."
        const cpMatch = line.match(/score cp (-?\d+)/);
        if (cpMatch) lastEval = parseInt(cpMatch[1], 10);

        const mateMatch = line.match(/score mate (-?\d+)/);
        if (mateMatch) {
          const moves = parseInt(mateMatch[1], 10);
          // Encode mate distance: mate 1 = ±10099, mate 3 = ±10097, mate 50 = ±10050
          const absN = Math.min(Math.abs(moves), 99);
          lastEval = moves > 0
            ? 10000 + (100 - absN)
            : -(10000 + (100 - absN));
        }

        if (line.startsWith("bestmove")) {
          clearTimeout(timeout);
          if (this.worker) this.worker.onmessage = originalOnMessage;
          resolve(lastEval);
        }
      };

      const timeout = setTimeout(() => {
        if (this.worker) this.worker.onmessage = originalOnMessage;
        this.stop();
        reject(new Error("Stockfish evaluate timeout (8s)"));
      }, 8000);

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /** Stop current search. */
  stop(): void {
    this.send("stop");
  }

  /** Terminate the Worker. */
  destroy(): void {
    this.destroyed = true;
    this.clearPending("Engine destroyed");
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  private onMessage(e: MessageEvent): void {
    const line = typeof e.data === "string" ? e.data : String(e.data);

    // Handle readyok response (from setSkill confirmation)
    if (line.includes("readyok") && this.readyResolve) {
      this.readyResolve();
      return;
    }

    if (line.startsWith("bestmove")) {
      const move = line.split(" ")[1];
      if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      this.pendingReject = null;
      resolve?.(move);
    }
  }

  private clearPending(reason: string): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    const reject = this.pendingReject;
    this.pendingResolve = null;
    this.pendingReject = null;
    reject?.(new Error(reason));
  }
}
