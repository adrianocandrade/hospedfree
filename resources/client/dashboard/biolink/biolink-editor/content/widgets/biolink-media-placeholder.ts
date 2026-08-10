import {useEffect, useMemo, useState} from 'react';

export type BiolinkPlaceholderKind = 'avatar' | 'content';

export function getBiolinkPlaceholderUrl(
  kind: BiolinkPlaceholderKind,
  seedParts: Array<string | number | null | undefined>,
): string {
  const style = kind === 'avatar' ? 'adventurer' : 'adventurer-neutral';
  const prefix = kind === 'avatar' ? 'rio-avatar' : 'rio-media';
  const seed = [prefix, ...seedParts]
    .filter(part => part !== null && part !== undefined && part !== '')
    .map(part => String(part).trim())
    .filter(Boolean)
    .join('-')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || prefix)}`;
}

export function useResilientImageSources(
  sources: Array<string | null | undefined>,
) {
  const candidates = useMemo(
    () => Array.from(new Set(sources.filter(Boolean) as string[])),
    // A stable joined key keeps callers free to build the source array inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sources.join('|')],
  );
  const candidatesKey = candidates.join('|');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [candidatesKey]);

  return {
    src: candidates[activeIndex],
    failed: candidates.length === 0 || activeIndex >= candidates.length,
    onError: () => setActiveIndex(index => index + 1),
  };
}
