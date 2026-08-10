export type PatternWallpaper = {
  src: string;
};

export const Patterns: PatternWallpaper[] = [
  ...Array.from({length: 33}, (_, index) => ({
    src: `/images/pattern/pattern-${index + 1}.svg`,
  })),
  {
    src: 'images/wallpapers/patterns/magic-pattern-geometric-1636044782020.webp',
  },
  {
    src: 'images/wallpapers/patterns/magic-pattern-geometric-1636044797673.webp',
  },
  {
    src: 'images/wallpapers/patterns/magic-pattern-geometric-1636044768859.webp',
  },
  {
    src: 'images/wallpapers/patterns/magic-pattern-geometric-1636044786321.webp',
  },
  {
    src: 'images/wallpapers/patterns/magic-pattern-geometric-1636044812786.webp',
  },
];
