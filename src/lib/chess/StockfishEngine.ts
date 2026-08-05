/**
 * StockfishEngine — controller for the Stockfish WASM Web Worker.
 * Promise-based UCI interface. Browser-only (uses Worker + postMessage).
 */

/** Result of a single search: evaluation + the engine's top choice. */
export interface EngineAnalysis {
  /** Centipawns from the side-to-move's perspective. Mate encoded by `encodeMate`. */
  cp: number;
  /** UCI of the engine's best move, or null when there is none ("(none)"). */
  bestMoveUci: string | null;
}

/**
 * Encode a UCI "score mate N" as a centipawn sentinel.
 *
 * Range: ±10001..±10100, where the magnitude grows as mate gets closer.
 *   mate 1  → +10099   mate -1  → -10099
 *   mate 99 → +10001   mate -99 → -10001
 *   mate 0  → -10100   (side to move is already checkmated — a loss)
 *
 * `mate 0` is only ever reported for a consumed mate, which is always a loss for
 * the side to move, so it maps to the negative extreme.
 */
export function encodeMate(moves: number): number {
  const absN = Math.min(Math.abs(moves), 99);
  const magnitude = 10000 + (100 - absN);
  return moves > 0 ? magnitude : -magnitude;
}

interface PendingSearch {
  resolve: (value: EngineAnalysis) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout> | null;
  lastCp: number;
  settled: boolean;
}

// 15s: a análise roda a depth 14 (e confirma Brilhante a 16) — em meio-jogo
// complexo no WASM single-thread, 10s estourava e o lance saía "pulado".
const SEARCH_TIMEOUT_MS = 15000;
const DRAIN_TIMEOUT_MS = 5000;

export class StockfishEngine {
  private worker: Worker | null = null;
  private pending: PendingSearch | null = null;
  private readyResolve: (() => void) | null = null;
  private destroyed = false;

  /**
   * Serialization gate. Every search waits for the previous one to fully finish
   * — including the drain of an abandoned search — before touching the worker.
   * One active search per instance, by construction.
   */
  private gate: Promise<void> = Promise.resolve();

  /**
   * Number of `bestmove` lines still owed by searches we gave up on. While this
   * is positive, an incoming `bestmove` belongs to a dead search and is dropped
   * instead of resolving the live one. This is the invariant that makes a late
   * reply un-consumable; the isready/readyok handshake below is the (faster)
   * synchronization on top of it.
   *
   * NOTE: this class is browser-only (Worker), so it has no automated test —
   * vitest runs in node. The guarantee here is by construction plus review.
   */
  private orphanBestMoves = 0;

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
    await this.waitReady(3000, "setSkill timeout (3s)");
  }

  /**
   * Search a position: evaluation (side-to-move POV) plus the engine's best move.
   * Searches are serialized — a call waits for any previous search to finish.
   */
  async analyze(fen: string, depth: number): Promise<EngineAnalysis> {
    return this.search(fen, depth);
  }

  /** Get the best move for a given FEN position. */
  async bestMove(fen: string, depth: number): Promise<string> {
    const { bestMoveUci } = await this.search(fen, depth);
    return bestMoveUci ?? "(none)";
  }

  /** Stop current search. */
  stop(): void {
    this.send("stop");
  }

  /** Terminate the Worker. */
  destroy(): void {
    this.destroyed = true;
    this.settlePending(new Error("Engine destroyed"));
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async search(fen: string, depth: number): Promise<EngineAnalysis> {
    const previous = this.gate;
    let release!: () => void;
    this.gate = new Promise<void>((r) => {
      release = r;
    });

    // Wait for the previous search (and its drain, if any) to release the engine.
    await previous.catch(() => {});

    try {
      if (this.destroyed || !this.worker) throw new Error("Engine not ready");

      const result = await new Promise<EngineAnalysis>((resolve, reject) => {
        const pending: PendingSearch = {
          resolve,
          reject,
          timeout: null,
          lastCp: 0,
          settled: false,
        };
        pending.timeout = setTimeout(() => {
          this.abandon(new Error(`Stockfish search timeout (${SEARCH_TIMEOUT_MS / 1000}s)`));
        }, SEARCH_TIMEOUT_MS);
        this.pending = pending;

        this.send(`position fen ${fen}`);
        this.send(`go depth ${depth}`);
      });

      return result;
    } catch (err) {
      // A search we gave up on still owes us one `bestmove`. Drain it before the
      // next search is allowed to start.
      if (this.orphanBestMoves > 0) await this.drain();
      throw err;
    } finally {
      release();
    }
  }

  /** Give up on the current search: reject it and mark its reply as orphaned. */
  private abandon(reason: Error): void {
    if (!this.pending || this.pending.settled) return;
    this.orphanBestMoves++;
    this.settlePending(reason);
    this.send("stop");
  }

  private settlePending(reason: Error): void {
    const pending = this.pending;
    this.pending = null;
    if (!pending || pending.settled) return;
    pending.settled = true;
    if (pending.timeout) clearTimeout(pending.timeout);
    pending.reject(reason);
  }

  /**
   * Wait for the abandoned search's `bestmove` to arrive and be discarded.
   * UCI guarantees a pending `bestmove` is emitted before `readyok`, so once
   * readyok lands the engine is idle and nothing is owed.
   */
  private async drain(): Promise<void> {
    try {
      await this.waitReady(DRAIN_TIMEOUT_MS, "Stockfish drain timeout (5s)");
    } catch {
      // Engine did not answer isready. The orphan counter below still protects
      // the next search from consuming a late reply.
      return;
    }
    this.orphanBestMoves = 0;
  }

  private waitReady(timeoutMs: number, message: string): Promise<void> {
    if (this.destroyed || !this.worker) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.readyResolve = null;
        reject(new Error(message));
      }, timeoutMs);
      this.readyResolve = () => {
        clearTimeout(timeout);
        this.readyResolve = null;
        resolve();
      };
      this.send("isready");
    });
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  private onMessage(e: MessageEvent): void {
    const line = typeof e.data === "string" ? e.data : String(e.data);

    if (line.includes("readyok") && this.readyResolve) {
      this.readyResolve();
      return;
    }

    const pending = this.pending;

    if (pending && !pending.settled) {
      // Parse "info ... score cp X ..." / "info ... score mate X ..."
      const cpMatch = line.match(/score cp (-?\d+)/);
      if (cpMatch) pending.lastCp = parseInt(cpMatch[1], 10);

      const mateMatch = line.match(/score mate (-?\d+)/);
      if (mateMatch) pending.lastCp = encodeMate(parseInt(mateMatch[1], 10));
    }

    if (!line.startsWith("bestmove")) return;

    // A reply owed by a search we already gave up on — never let it resolve the
    // live search.
    if (this.orphanBestMoves > 0) {
      this.orphanBestMoves--;
      return;
    }

    if (!pending || pending.settled) return;

    const token = line.split(" ")[1];
    pending.settled = true;
    this.pending = null;
    if (pending.timeout) clearTimeout(pending.timeout);
    pending.resolve({
      cp: pending.lastCp,
      bestMoveUci: !token || token === "(none)" ? null : token,
    });
  }
}
