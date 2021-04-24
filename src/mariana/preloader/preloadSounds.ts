export function getSoundsToPreload(): string[] {
  // use a set to make sure we don't include stuff multiple times
  const urls = new Set<string>([]);

  // Just in case this sneaks in there somehow, make sure we don't load it
  urls.delete(undefined!);

  return Array.from(urls);
}
