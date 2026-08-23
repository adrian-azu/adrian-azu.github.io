// OWNER: 03-simulation-engine.md — do not edit from another role
//
// Pure mock of a fictional payments service used by the "API Playground" tab. Every call to
// `sendRequest` is a self-contained simulation step: no network I/O, no `Math.random()` (all
// randomness comes from the caller-supplied `rng`), no `Date.now()` (the caller supplies `nowMs`,
// so a whole session is reproducible by replaying the same seed + call sequence).
//
// STATE NOTE: `sendRequest` intentionally keeps two pieces of module-level state that a *real*
// backend would keep server-side: an idempotency-key -> response cache, and a rolling log of
// call timestamps for client-side rate limiting. Both are necessary to honor the contract (a
// replayed idempotency key must return the *original* response; the 6th call in a 10s window
// must be rejected) and neither is a source of nondeterminism — both are driven entirely by the
// `idempotencyKey` / `nowMs` the caller passes in, never by wall-clock time or Math.random().
// Call `resetPlaygroundState()` to clear both (role 05 should call it whenever the visitor
// resets/reseeds a playground session; tests call it between cases for isolation).
import type { MockEndpoint } from "@/lib/types";

/** The 4 mock routes rendered in the API Playground tab, against a fictional payments service. */
export const endpoints: MockEndpoint[] = [
  {
    method: "POST",
    path: "/v1/payments",
    sampleRequest: { amount: 4200, currency: "USD", source: "tok_visa" },
    latencyRangeMs: [45, 115],
  },
  {
    method: "GET",
    path: "/v1/payments/:id",
    sampleRequest: null,
    latencyRangeMs: [40, 100],
  },
  {
    method: "POST",
    path: "/v1/transfers",
    sampleRequest: { fromAccountId: "acct_1", toAccountId: "acct_2", amountCents: 1500 },
    latencyRangeMs: [55, 120],
  },
  {
    method: "GET",
    path: "/v1/accounts/:id/balance",
    sampleRequest: null,
    latencyRangeMs: [40, 90],
  },
];

interface SendRequestInput {
  endpoint: MockEndpoint;
  idempotencyKey?: string;
  authToken: "valid" | "expired";
  downstreamHealth: "up" | "degraded" | "down";
  rng: () => number;
  nowMs: number;
  /**
   * Additive to the brief's minimal contract: the JSON body the visitor is (conceptually)
   * sending. Defaults to `endpoint.sampleRequest` (always valid) when omitted, so existing
   * callers that only pass the original 6 fields keep getting 2xx/40x/50x responses driven by
   * the other toggles. Pass a deliberately malformed object to exercise the 400 path.
   */
  requestBody?: unknown;
}

interface SendRequestOutput {
  status: number;
  body: unknown;
  latencyMs: number;
  headers: Record<string, string>;
}

interface FieldError {
  field: string;
  message: string;
}

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_PER_WINDOW = 5;

/** All call timestamps (nowMs) seen so far, used for the rolling rate-limit window. */
let callLog: number[] = [];
/** idempotencyKey -> the full response returned the first time that key was used. */
const idempotencyCache = new Map<string, SendRequestOutput>();

/** Clears rate-limit history and the idempotency cache — call between independent sessions/tests. */
export function resetPlaygroundState(): void {
  callLog = [];
  idempotencyCache.clear();
}

function randomHex(rng: () => number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(rng() * 16).toString(16);
  }
  return out;
}

function traceId(rng: () => number): string {
  return `trc_${randomHex(rng, 16)}`;
}

/** Draws one latency sample (ms) for `endpoint`: mostly in-range, occasionally a tail spike. */
function sampleLatencyMs(rng: () => number, endpoint: MockEndpoint): number {
  const [min, max] = endpoint.latencyRangeMs;
  const isTailSpike = rng() < 0.08;
  if (isTailSpike) {
    return Math.round(300 + rng() * 300); // 300-600ms occasional spike
  }
  return Math.round(min + rng() * (max - min));
}

function validateBody(endpoint: MockEndpoint, body: unknown): FieldError[] {
  const errors: FieldError[] = [];
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  if (endpoint.method === "POST" && endpoint.path === "/v1/payments") {
    const amount = record.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      errors.push({ field: "amount", message: "amount must be a positive number (minor currency units)" });
    }
    const currency = record.currency;
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      errors.push({ field: "currency", message: "currency must be a 3-letter ISO 4217 code, e.g. USD" });
    }
    const source = record.source;
    if (typeof source !== "string" || source.trim().length === 0) {
      errors.push({ field: "source", message: "source is required and must be a payment source token" });
    }
  }

  if (endpoint.method === "POST" && endpoint.path === "/v1/transfers") {
    const fromAccountId = record.fromAccountId;
    const toAccountId = record.toAccountId;
    if (typeof fromAccountId !== "string" || fromAccountId.trim().length === 0) {
      errors.push({ field: "fromAccountId", message: "fromAccountId is required" });
    }
    if (typeof toAccountId !== "string" || toAccountId.trim().length === 0) {
      errors.push({ field: "toAccountId", message: "toAccountId is required" });
    } else if (fromAccountId === toAccountId) {
      errors.push({ field: "toAccountId", message: "toAccountId must differ from fromAccountId" });
    }
    const amountCents = record.amountCents;
    if (typeof amountCents !== "number" || !Number.isFinite(amountCents) || amountCents <= 0) {
      errors.push({ field: "amountCents", message: "amountCents must be a positive number" });
    }
  }

  return errors;
}

function buildSuccessBody(endpoint: MockEndpoint, rng: () => number, nowMs: number, body: unknown): { status: number; payload: unknown } {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const createdAt = new Date(nowMs).toISOString();

  if (endpoint.method === "POST" && endpoint.path === "/v1/payments") {
    return {
      status: 201,
      payload: {
        id: `pay_${randomHex(rng, 12)}`,
        status: "succeeded",
        amount: record.amount,
        currency: record.currency,
        createdAt,
      },
    };
  }
  if (endpoint.method === "GET" && endpoint.path === "/v1/payments/:id") {
    return {
      status: 200,
      payload: {
        id: `pay_${randomHex(rng, 12)}`,
        status: "succeeded",
        amount: 4200,
        currency: "USD",
        createdAt,
      },
    };
  }
  if (endpoint.method === "POST" && endpoint.path === "/v1/transfers") {
    return {
      status: 201,
      payload: {
        id: `txn_${randomHex(rng, 12)}`,
        status: "completed",
        fromAccountId: record.fromAccountId,
        toAccountId: record.toAccountId,
        amountCents: record.amountCents,
        createdAt,
      },
    };
  }
  // GET /v1/accounts/:id/balance
  return {
    status: 200,
    payload: {
      accountId: "acct_1",
      balanceCents: Math.floor(500_000 + rng() * 4_500_000),
      currency: "USD",
      asOf: createdAt,
    },
  };
}

/**
 * Simulates one call against the mock payments catalog and returns its status/body/latency/headers.
 * Pure — no network, no `Math.random()`, no `Date.now()`; fully driven by `rng` + `nowMs`.
 *
 * Resolution order (matches how a real API gateway layers these concerns): rate limit -> cached
 * idempotency replay -> auth -> body validation -> downstream health -> success.
 */
export function sendRequest(input: SendRequestInput): SendRequestOutput {
  const { endpoint, idempotencyKey, authToken, downstreamHealth, rng, nowMs } = input;
  const requestBody = input.requestBody ?? endpoint.sampleRequest;

  // 1. Rolling client-side rate limit: 6th+ call within the last 10s window -> 429.
  const windowStart = nowMs - RATE_LIMIT_WINDOW_MS;
  const callsInWindow = callLog.filter((t) => t > windowStart).length;
  callLog.push(nowMs);
  if (callsInWindow >= RATE_LIMIT_MAX_PER_WINDOW) {
    const oldestInWindow = Math.min(...callLog.filter((t) => t > windowStart));
    const retryAfterSec = Math.max(1, Math.ceil((oldestInWindow + RATE_LIMIT_WINDOW_MS - nowMs) / 1000));
    return {
      status: 429,
      body: { error: "rate_limited", message: `More than ${RATE_LIMIT_MAX_PER_WINDOW} requests in ${RATE_LIMIT_WINDOW_MS / 1000}s` },
      latencyMs: Math.round(5 + rng() * 10),
      headers: {
        "content-type": "application/json",
        "x-trace-id": traceId(rng),
        "retry-after": String(retryAfterSec),
      },
    };
  }

  // 2. Idempotency replay: same key seen before -> return the cached original response, byte-
  //    identical body, wrapped in a 409 to signal "this exact request was already processed".
  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached) {
      return {
        status: 409,
        body: cached.body,
        latencyMs: Math.round(5 + rng() * 10),
        headers: {
          "content-type": "application/json",
          "x-trace-id": traceId(rng),
          "idempotency-replayed": "true",
        },
      };
    }
  }

  const finalize = (result: SendRequestOutput): SendRequestOutput => {
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, result);
    }
    return result;
  };

  // 3. Auth.
  if (authToken === "expired") {
    return finalize({
      status: 401,
      body: { error: "token_expired", expiresAt: new Date(nowMs - 60 * 60 * 1000).toISOString() },
      latencyMs: sampleLatencyMs(rng, endpoint),
      headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
    });
  }

  // 4. Body validation.
  const fieldErrors = validateBody(endpoint, requestBody);
  if (fieldErrors.length > 0) {
    return finalize({
      status: 400,
      body: { errors: fieldErrors },
      latencyMs: sampleLatencyMs(rng, endpoint),
      headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
    });
  }

  // 5. Downstream health.
  if (downstreamHealth === "down") {
    const timeoutMs = Math.round(2500 + rng() * 1500); // simulated timeout window before giving up
    return finalize({
      status: 504,
      body: { error: "downstream_timeout", message: "Downstream payments processor did not respond in time" },
      latencyMs: timeoutMs,
      headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
    });
  }

  if (downstreamHealth === "degraded") {
    const elevatedLatency = Math.round(sampleLatencyMs(rng, endpoint) * (1.8 + rng() * 1.2));
    const isDownstreamError = rng() < 0.2;
    if (isDownstreamError) {
      return finalize({
        status: 500,
        body: { error: "downstream_error", message: "Downstream payments processor returned an unexpected error" },
        latencyMs: elevatedLatency,
        headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
      });
    }
    const { status, payload } = buildSuccessBody(endpoint, rng, nowMs, requestBody);
    return finalize({
      status,
      body: payload,
      latencyMs: elevatedLatency,
      headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
    });
  }

  // 6. Happy path.
  const { status, payload } = buildSuccessBody(endpoint, rng, nowMs, requestBody);
  return finalize({
    status,
    body: payload,
    latencyMs: sampleLatencyMs(rng, endpoint),
    headers: { "content-type": "application/json", "x-trace-id": traceId(rng) },
  });
}
