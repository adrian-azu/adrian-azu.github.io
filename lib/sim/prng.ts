// OWNER: 03-simulation-engine.md — do not edit from another role
//
// Every source of randomness anywhere under lib/sim/** must be drawn from the generator returned
// here. No Math.random() is used anywhere in this module tree; a run is fully reproducible from
// its `seed` alone.

/**
 * Returns a seeded `[0,1)` pseudo-random number generator (mulberry32). Same seed -> same
 * infinite sequence of calls, every time, on every platform.
 */
export function mulberry32(seed: number): () => number {
  // Force the internal state into a 32-bit unsigned integer so the algorithm behaves identically
  // regardless of how large/negative/fractional the caller's seed is.
  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
