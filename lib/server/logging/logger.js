/**
 * Structured logger.
 *
 *  - JSON lines in production (easy to ship to any log platform), readable
 *    lines in development, silent in tests unless LOG_LEVEL is set.
 *  - Everything passes through `redact()` so passwords, tokens, signatures,
 *    Aadhaar, UPI ids and e-mail addresses never reach the log stream.
 *  - Output goes through a `Sink` (Interface Segregation / Dependency
 *    Inversion): swap the sink to forward logs elsewhere without touching
 *    call sites.
 */
import { redact } from "./redact.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

/** @typedef {{ write(entry: object): void }} Sink */

export class ConsoleSink {
  constructor({ pretty = false } = {}) {
    this.pretty = pretty;
  }

  write(entry) {
    const method =
      entry.level === "error"
        ? "error"
        : entry.level === "warn"
          ? "warn"
          : "log";
    if (this.pretty) {
      const { time, level, msg, ...rest } = entry;
      const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
      console[method](`[${time}] ${level.toUpperCase()} ${msg}${extra}`);
    } else {
      console[method](JSON.stringify(entry));
    }
  }
}

/** In-memory sink, used by the test-suite. */
export class MemorySink {
  constructor() {
    this.entries = [];
  }
  write(entry) {
    this.entries.push(entry);
  }
  clear() {
    this.entries = [];
  }
}

function defaultLevel() {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured && configured in LEVELS) return configured;
  if (process.env.NODE_ENV === "test") return "silent";
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export class Logger {
  /**
   * @param {{ level?: string, sink?: Sink, bindings?: object }} [opts]
   */
  constructor({ level = defaultLevel(), sink, bindings = {} } = {}) {
    this.level = level;
    this.sink =
      sink ||
      new ConsoleSink({ pretty: process.env.NODE_ENV !== "production" });
    this.bindings = bindings;
  }

  child(bindings = {}) {
    return new Logger({
      level: this.level,
      sink: this.sink,
      bindings: { ...this.bindings, ...bindings },
    });
  }

  enabled(level) {
    return LEVELS[level] >= LEVELS[this.level];
  }

  log(level, msg, fields) {
    if (!this.enabled(level)) return;
    let data = fields;
    if (fields instanceof Error) data = { err: fields };

    this.sink.write({
      time: new Date().toISOString(),
      level,
      msg,
      ...redact(this.bindings),
      ...(data ? redact(data) : {}),
    });
  }

  debug(msg, fields) {
    this.log("debug", msg, fields);
  }
  info(msg, fields) {
    this.log("info", msg, fields);
  }
  warn(msg, fields) {
    this.log("warn", msg, fields);
  }
  error(msg, fields) {
    this.log("error", msg, fields);
  }
}

/** Process-wide root logger. Use `logger.child({ ... })` for context. */
export const logger = new Logger();
export default logger;
