// OWNER: 03-simulation-engine.md — do not edit from another role
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/sim/prng";

describe("mulberry32", () => {
  it("is deterministic: same seed produces the exact same sequence", () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("always returns numbers within [0, 1)", () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("resuming a generator continues the same deterministic sequence (no hidden wall-clock state)", () => {
    const rng1 = mulberry32(42);
    const first5 = Array.from({ length: 5 }, () => rng1());

    const rng2 = mulberry32(42);
    const alsoFirst5 = Array.from({ length: 5 }, () => rng2());
    const next5 = Array.from({ length: 5 }, () => rng2());

    expect(alsoFirst5).toEqual(first5);
    // The generator's internal state, not wall-clock time, drives progression.
    expect(next5).not.toEqual(first5);
  });
});
