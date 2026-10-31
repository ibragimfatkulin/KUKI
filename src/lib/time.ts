export function allocateTime(weights: number[], total: number) {
  const count = weights.length;
  if (count === 0) return [];
  const safeTotal = Math.max(count, total);
  const safeWeights = weights.map((weight) => Math.max(1, weight));
  const sum = safeWeights.reduce((totalWeight, weight) => totalWeight + weight, 0);
  const raw = safeWeights.map((weight) => Math.max(1, Math.floor((weight / sum) * safeTotal)));
  let diff = safeTotal - raw.reduce((totalTime, value) => totalTime + value, 0);
  let guard = 0;
  while (diff !== 0 && guard < 200) {
    if (diff > 0) {
      raw[guard % count] += 1;
      diff -= 1;
    } else {
      const donor = raw.findIndex((value) => value > 1);
      if (donor < 0) break;
      raw[donor] -= 1;
      diff += 1;
    }
    guard += 1;
  }
  return raw;
}
