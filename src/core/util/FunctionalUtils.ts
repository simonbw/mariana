export function identity<T>(a: T): T {
  return a;
}

export function last<T>(a: T[]): T {
  return a[a.length - 1];
}

export function range(min: number, max: number, stepSize = 1): number[] {
  const result = [];
  for (let i = min; i < max; i += stepSize) {
    result.push(i);
  }
  return result;
}
