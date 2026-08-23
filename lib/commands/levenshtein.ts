// OWNER: 04-terminal-shell.md — do not edit from another role
// Classic iterative edit-distance (two-row DP), used by Terminal.tsx to suggest existing command
// names when an unknown command is typed (BUILD_PROMPT.md §3: suggest names within distance <= 2).

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let previousRow: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  let currentRow: number[] = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i += 1) {
    currentRow[0] = i;
    const aChar = a.charAt(i - 1);
    for (let j = 1; j <= n; j += 1) {
      const bChar = b.charAt(j - 1);
      const cost = aChar === bChar ? 0 : 1;
      const deletion = (previousRow[j] ?? 0) + 1;
      const insertion = (currentRow[j - 1] ?? 0) + 1;
      const substitution = (previousRow[j - 1] ?? 0) + cost;
      currentRow[j] = Math.min(deletion, insertion, substitution);
    }
    const swap = previousRow;
    previousRow = currentRow;
    currentRow = swap;
  }

  return previousRow[n] ?? 0;
}
