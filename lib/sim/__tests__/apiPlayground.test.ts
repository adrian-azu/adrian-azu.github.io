// OWNER: 03-simulation-engine.md — do not edit from another role
import { beforeEach, describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/sim/prng";
import { endpoints, resetPlaygroundState, sendRequest } from "@/lib/sim/apiPlayground";

const paymentsPost = endpoints.find((e) => e.method === "POST" && e.path === "/v1/payments");
const paymentsGet = endpoints.find((e) => e.method === "GET" && e.path === "/v1/payments/:id");
const transfersPost = endpoints.find((e) => e.method === "POST" && e.path === "/v1/transfers");
const balanceGet = endpoints.find((e) => e.method === "GET" && e.path === "/v1/accounts/:id/balance");

beforeEach(() => {
  resetPlaygroundState();
});

describe("endpoints catalog", () => {
  it("exposes exactly the 4 required mock routes", () => {
    expect(endpoints).toHaveLength(4);
    expect(paymentsPost).toBeDefined();
    expect(paymentsGet).toBeDefined();
    expect(transfersPost).toBeDefined();
    expect(balanceGet).toBeDefined();
  });
});

describe("sendRequest — status code paths", () => {
  it("401: expired token returns token_expired with an expiresAt", () => {
    const rng = mulberry32(1);
    const res = sendRequest({
      endpoint: paymentsPost!,
      authToken: "expired",
      downstreamHealth: "up",
      rng,
      nowMs: 0,
    });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "token_expired" });
    expect((res.body as { expiresAt: string }).expiresAt).toBeTypeOf("string");
  });

  it("400: invalid body returns field-level errors", () => {
    const rng = mulberry32(2);
    const res = sendRequest({
      endpoint: paymentsPost!,
      authToken: "valid",
      downstreamHealth: "up",
      rng,
      nowMs: 0,
      requestBody: { amount: -5 }, // missing currency/source, negative amount
    });
    expect(res.status).toBe(400);
    const body = res.body as { errors: { field: string; message: string }[] };
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.errors.map((e) => e.field)).toContain("amount");
    expect(body.errors.map((e) => e.field)).toContain("currency");
  });

  it("409: reused idempotency key returns a byte-identical body to the original call", () => {
    const rng = mulberry32(3);
    const first = sendRequest({
      endpoint: paymentsPost!,
      idempotencyKey: "idem-abc",
      authToken: "valid",
      downstreamHealth: "up",
      rng,
      nowMs: 0,
    });
    expect(first.status).toBe(201);

    const second = sendRequest({
      endpoint: paymentsPost!,
      idempotencyKey: "idem-abc",
      authToken: "valid",
      downstreamHealth: "up",
      rng,
      nowMs: 500,
    });
    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toBe(JSON.stringify(first.body));
  });

  it("500: downstream degraded eventually produces an occasional downstream error", () => {
    let found = false;
    for (let seed = 0; seed < 500 && !found; seed++) {
      resetPlaygroundState();
      const rng = mulberry32(seed);
      const res = sendRequest({
        endpoint: paymentsPost!,
        authToken: "valid",
        downstreamHealth: "degraded",
        rng,
        nowMs: 0,
      });
      if (res.status === 500) {
        found = true;
        expect(res.body).toMatchObject({ error: "downstream_error" });
      }
    }
    expect(found).toBe(true);
  });

  it("504: downstream down always times out", () => {
    const rng = mulberry32(4);
    const res = sendRequest({
      endpoint: paymentsPost!,
      authToken: "valid",
      downstreamHealth: "down",
      rng,
      nowMs: 0,
    });
    expect(res.status).toBe(504);
    expect(res.body).toMatchObject({ error: "downstream_timeout" });
    expect(res.latencyMs).toBeGreaterThanOrEqual(2500);
  });

  it("429: the 6th call within a rolling 10s window is rate-limited with Retry-After", () => {
    const rng = mulberry32(5);
    const timestamps = [0, 1000, 2000, 3000, 4000, 5000];
    const results = timestamps.map((nowMs) =>
      sendRequest({
        endpoint: paymentsPost!,
        authToken: "valid",
        downstreamHealth: "up",
        rng,
        nowMs,
      }),
    );
    for (let i = 0; i < 5; i++) {
      expect(results[i]!.status).not.toBe(429);
    }
    const sixth = results[5]!;
    expect(sixth.status).toBe(429);
    expect(sixth.headers["retry-after"]).toBeDefined();
    expect(Number(sixth.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("calls outside the rolling window are not rate-limited", () => {
    const rng = mulberry32(6);
    for (let i = 0; i < 5; i++) {
      sendRequest({ endpoint: paymentsPost!, authToken: "valid", downstreamHealth: "up", rng, nowMs: i * 1000 });
    }
    const later = sendRequest({
      endpoint: paymentsPost!,
      authToken: "valid",
      downstreamHealth: "up",
      rng,
      nowMs: 20_000, // well outside the 10s window of the first 5 calls
    });
    expect(later.status).not.toBe(429);
  });
});

describe("sendRequest — latency model", () => {
  it("latency is never constant across repeated calls and stays within documented bounds", () => {
    const rng = mulberry32(7);
    const latencies = Array.from({ length: 40 }, (_, i) => {
      resetPlaygroundState();
      return sendRequest({
        endpoint: balanceGet!,
        authToken: "valid",
        downstreamHealth: "up",
        rng,
        nowMs: i * 1000,
      }).latencyMs;
    });
    const distinctValues = new Set(latencies);
    expect(distinctValues.size).toBeGreaterThan(1);
    for (const ms of latencies) {
      expect(ms).toBeGreaterThanOrEqual(40);
      expect(ms).toBeLessThanOrEqual(600);
    }
  });

  it("every response includes an x-trace-id header", () => {
    const rng = mulberry32(8);
    const res = sendRequest({ endpoint: transfersPost!, authToken: "valid", downstreamHealth: "up", rng, nowMs: 0 });
    expect(res.headers["x-trace-id"]).toMatch(/^trc_[0-9a-f]{16}$/);
  });
});
