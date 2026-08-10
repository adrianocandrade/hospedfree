import {Apple} from '@common/background-selector/images/wallpapers/apple';
import {Gradients} from '@common/background-selector/images/wallpapers/gradients';
import {Macos} from '@common/background-selector/images/wallpapers/macos';
import {Patterns as WallpaperPatterns} from '@common/background-selector/images/wallpapers/patterns';
import {Raycast} from '@common/background-selector/images/wallpapers/raycast';

export type BiolinkAssetCategoryId =
  | 'icons'
  | 'emoji'
  | 'threeD'
  | 'patterns'
  | 'blockStyles'
  | 'scribbles'
  | 'libraryIcons'
  | 'wallpapers';

export interface BiolinkAssetItem {
  label: string;
  path: string;
}

export interface BiolinkAssetCategory {
  id: BiolinkAssetCategoryId;
  label: string;
  items: BiolinkAssetItem[];
}

function asset(label: string, path: string): BiolinkAssetItem {
  return {label, path};
}

function wallpaperAssets(): BiolinkAssetItem[] {
  const groups: [string, {src: string}[]][] = [
    ['Gradient', Gradients],
    ['macOS', Macos],
    ['Raycast', Raycast],
    ['Apple', Apple],
    [
      'Pattern',
      WallpaperPatterns.filter(item =>
        item.src.includes('/images/wallpapers/'),
      ),
    ],
  ];

  return groups.flatMap(([group, items]) =>
    items.map(item => {
      const path = item.src.startsWith('/') ? item.src : `/${item.src}`;
      const filename =
        path
          .split('/')
          .at(-1)
          ?.replace(/\.[^.]+$/, '') ?? '';
      const name = filename
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());

      return asset(`${group} - ${name}`, path);
    }),
  );
}

export const biolinkAssetCategories: BiolinkAssetCategory[] = [
  {
    id: 'icons',
    label: 'Icons',
    items: [
      asset('Shopping Cart', '/images/svg/icons/Shopping%20Cart.svg'),
      asset(
        'Shopping Bag',
        '/images/svg/icons/Shopping%20Bag%20With%20Heart.svg',
      ),
      asset('Shopping List', '/images/svg/icons/Shopping%20List.svg'),
      asset('Fire', '/images/svg/icons/Fire.svg'),
      asset('Calendar', '/images/svg/icons/Calendar.svg'),
      asset('Checkmark', '/images/svg/icons/Checkmark.svg'),
      asset('New Badge', '/images/svg/icons/New%20Badge.svg'),
      asset('Free Badge', '/images/svg/icons/Free%20Badge.svg'),
      asset('Star Badge', '/images/svg/icons/House%20%2B%20Star.svg'),
      asset('External Link', '/images/svg/icons/Hyperlink.svg'),
      asset('Delivery', '/images/svg/icons/Delivery%20Truck.svg'),
      asset('Heart', '/images/svg/icons/Heart.svg'),
      asset('Price Tag', '/images/svg/icons/Price%20Tag.svg'),
      asset('Ticket', '/images/svg/icons/Discount%20Coupon.svg'),
      asset('Gift', '/images/svg/icons/Present.svg'),
      asset('Book', '/images/svg/icons/Book%20Open.svg'),
      asset('Rocket', '/images/svg/icons/Rocket.svg'),
      asset('Flash', '/images/svg/icons/Flash.svg'),
      asset('Map Pin', '/images/svg/icons/Location.svg'),
      asset('Accessibility', '/images/svg/icons/Accessibility.svg'),
      asset('Bookmark', '/images/svg/icons/Bookmark.svg'),
      asset('Camera', '/images/svg/icons/Image%20(Single).svg'),
      asset('Chat', '/images/svg/icons/Megaphone.svg'),
      asset('Clock', '/images/svg/icons/Clock.svg'),
      asset('Download', '/images/svg/icons/Download.svg'),
      asset('Email', '/images/svg/icons/Image%20(Single).svg'),
      asset('Eye', '/images/svg/icons/Eye.svg'),
      asset('Folder', '/images/svg/icons/Folder.svg'),
      asset('Globe', '/images/svg/icons/Location.svg'),
      asset('Home', '/images/svg/icons/Home.svg'),
      asset('Music', '/images/svg/icons/Airplay.svg'),
      asset('Phone', '/images/svg/icons/Location.svg'),
      asset('Play', '/images/svg/icons/Play%20(Normal).svg'),
      asset('Settings', '/images/svg/icons/Settings%20Gear.svg'),
      asset('Share', '/images/svg/icons/Share.svg'),
      asset('Trophy', '/images/svg/icons/New%20Badge.svg'),
    ],
  },
  {
    id: 'libraryIcons',
    label: 'Library icons',
    items: [
      asset('Heart', 'lucide:Heart'),
      asset('Sparkles', 'lucide:Sparkles'),
      asset('Star', 'lucide:Star'),
      asset('Badge check', 'lucide:BadgeCheck'),
      asset('Camera', 'lucide:Camera'),
      asset('Gift', 'lucide:Gift'),
      asset('Link', 'lucide:Link'),
      asset('Mail', 'lucide:Mail'),
      asset('Map pin', 'lucide:MapPin'),
      asset('Music', 'lucide:Music2'),
      asset('Play', 'lucide:Play'),
      asset('Zap', 'lucide:Zap'),
      asset('GitHub', 'simple-icons:github'),
      asset('Instagram', 'simple-icons:instagram'),
      asset('TikTok', 'simple-icons:tiktok'),
      asset('YouTube', 'simple-icons:youtube'),
      asset('Discord', 'simple-icons:discord'),
      asset('Facebook', 'simple-icons:facebook'),
      asset('X', 'simple-icons:x'),
    ],
  },
  {
    id: 'wallpapers',
    label: 'Wallpapers',
    items: wallpaperAssets(),
  },
  {
    id: 'emoji',
    label: 'Emoji',
    items: [
      asset('Happy', '/images/emoji/Yellow-1/Happy.png'),
      asset('Smile', '/images/emoji/Yellow-1/Smile.png'),
      asset('Cool', '/images/emoji/Yellow-1/Cool.png'),
      asset('Party', '/images/emoji/Yellow-1/Party.png'),
      asset('Heart Eyes', '/images/emoji/Yellow-1/HeartEyes.png'),
      asset('Star Eyes', '/images/emoji/Yellow-1/StarEyes.png'),
      asset('Wink', '/images/emoji/Yellow-1/Wink.png'),
      asset('Idea', '/images/emoji/Yellow-1/Idea.png'),
      asset('Money Mouth', '/images/emoji/Yellow-1/MoneyMouthFace.png'),
      asset('Like', '/images/emoji/Yellow-1/Like.png'),
      asset('Wave', '/images/emoji/Gestures-Yellow/Wave.png'),
      asset('Thumbs Up', '/images/emoji/Gestures-Yellow/ThumbsUp.png'),
      asset('Pray', '/images/emoji/Gestures-Yellow/Pray.png'),
      asset('Love', '/images/emoji/Gestures-Yellow/Love.png'),
      asset('Victory', '/images/emoji/Gestures-Yellow/Victory.png'),
      asset('Call Me', '/images/emoji/Gestures-Yellow/CallMe.png'),
    ],
  },
  {
    id: 'threeD',
    label: '3D',
    items: [
      asset('Sphere 1', '/images/3d/Sphere-1.png'),
      asset('Sphere 2', '/images/3d/Sphere-2.png'),
      asset('Preloader', '/images/3d/Preloader-1.png'),
      asset('Pencil', '/images/3d/Pencil-1.png'),
      asset('Pen', '/images/3d/Pen-1.png'),
      asset('Mobile', '/images/3d/mobile-1.png'),
      asset('Layers', '/images/3d/Layers-1.png'),
      asset('Graph 1', '/images/3d/Graph-1.png'),
      asset('Graph 2', '/images/3d/Graph-2.png'),
      asset('Card', '/images/3d/Card-1.png'),
      asset('Shape 1', '/images/3d/1.png'),
      asset('Shape 2', '/images/3d/2.png'),
      asset('Shape 3', '/images/3d/3.png'),
      asset('Shape 4', '/images/3d/4.png'),
      asset('Shape 5', '/images/3d/5.png'),
      asset('Shape 498', '/images/3d/498.png'),
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    items: Array.from({length: 33}, (_, index) =>
      asset(`Pattern ${index + 1}`, `/images/pattern/pattern-${index + 1}.svg`),
    ),
  },
  {
    id: 'blockStyles',
    label: 'Block Styles',
    items: [
      asset('3D Border', '/images/block-styles/border-3d.png'),
      asset('Double Border', '/images/block-styles/border-double.png'),
      asset('Pixel Border', '/images/block-styles/border-pixel-bold.png'),
    ],
  },
  {
    id: 'scribbles',
    label: 'Scribbles',
    items: [
      asset('Scribble 1', '/images/scribbbles/1.png'),
      asset('Scribble 2', '/images/scribbbles/2.png'),
      asset('Scribble 3', '/images/scribbbles/3.png'),
      asset('Scribble 4', '/images/scribbbles/4.png'),
      asset('Scribble 5', '/images/scribbbles/5.png'),
      asset('Scribble 10', '/images/scribbbles/10.png'),
      asset('Scribble 11', '/images/scribbbles/11.png'),
      asset('Scribble 20', '/images/scribbbles/20.png'),
      asset('Scribble 30', '/images/scribbbles/30.png'),
      asset('Scribble 40', '/images/scribbbles/40.png'),
      asset('Scribble 50', '/images/scribbbles/50.png'),
      asset('Scribble 60', '/images/scribbbles/60.png'),
    ],
  },
];

export function biolinkAssetCategory(
  id: BiolinkAssetCategoryId,
): BiolinkAssetCategory {
  return biolinkAssetCategories.find(category => category.id === id)!;
}
