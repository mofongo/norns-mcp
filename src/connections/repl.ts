import WebSocket from "ws";
import { randomUUID } from "crypto";

const SENTINEL_PREFIX = "__NORNS_MCP_";
const SENTINEL_SUFFIX = "__";
const DEFAULT_TIMEOUT = 10000;

interface PendingRequest {
  sentinel: string;
  output: string[];
  resolve: (output: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class NornsRepl {
  private ws: WebSocket | null = null;
  private pending: PendingRequest | null = null;
  private buffer = "";
  private host: string;
  private connectPromise: Promise<void> | null = null;

  constructor(host: string) {
    this.host = host;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const url = `ws://${this.host}:5555`;
      this.ws = new WebSocket(url, "bus.sp.nanomsg.org");

      const timeout = setTimeout(() => {
        this.ws?.terminate();
        this.connectPromise = null;
        reject(new Error(`Connection to ${url} timed out`));
      }, 5000);

      this.ws.on("open", () => {
        clearTimeout(timeout);
        this.connectPromise = null;
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.onMessage(data.toString());
      });

      this.ws.on("error", (err: Error) => {
        clearTimeout(timeout);
        this.connectPromise = null;
        reject(err);
      });

      this.ws.on("close", () => {
        this.ws = null;
        this.connectPromise = null;
        if (this.pending) {
          this.pending.reject(new Error("WebSocket connection closed"));
          this.pending = null;
        }
      });
    });

    return this.connectPromise;
  }

  private onMessage(data: string): void {
    if (!this.pending) return;

    this.buffer += data;

    const sentinelFull = SENTINEL_PREFIX + this.pending.sentinel + SENTINEL_SUFFIX;
    const idx = this.buffer.indexOf(sentinelFull);

    if (idx !== -1) {
      const output = this.buffer.substring(0, idx);
      this.buffer = this.buffer.substring(idx + sentinelFull.length);

      const { resolve, timer } = this.pending;
      clearTimeout(timer);
      this.pending = null;

      // Clean up output: remove trailing newlines and the sentinel print echo
      const cleaned = output.replace(/\s*$/, "");
      resolve(cleaned);
    }
  }

  async eval(code: string, timeout = DEFAULT_TIMEOUT): Promise<string> {
    await this.connect();

    if (this.pending) {
      throw new Error("A request is already pending. The REPL is single-threaded.");
    }

    const id = randomUUID().replace(/-/g, "").substring(0, 12);
    const sentinel = id;
    const sentinelCode = `print("${SENTINEL_PREFIX}${sentinel}${SENTINEL_SUFFIX}")`;

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        this.buffer = "";
        reject(new Error(`REPL eval timed out after ${timeout}ms`));
      }, timeout);

      this.pending = { sentinel, output: [], resolve, reject, timer };
      this.buffer = "";

      // Send the user code, then the sentinel
      this.ws!.send(code + "\n");
      this.ws!.send(sentinelCode + "\n");
    });
  }

  close(): void {
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject(new Error("REPL closed"));
      this.pending = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
