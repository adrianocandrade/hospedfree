import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {Trans} from '@ui/i18n/trans';
import type {ReactNode} from 'react';
import {
  WidgetList,
  type AddContentCategory,
  type AddContentStatus,
} from './widget-list';

type WidgetType = BiolinkWidget['type'];

export interface WidgetCatalogEntry {
  id: string;
  type: WidgetType;
  name: ReactNode;
  searchName: string;
  description: ReactNode;
  searchDescription: string;
  category: AddContentCategory;
  image: string;
  keywords: string[];
  initialConfig: Record<string, unknown>;
  initialItems?: Array<Record<string, unknown>>;
  featured?: boolean;
  sortOrder: number;
  status: AddContentStatus;
}

const icon = (name: string) => `/images/icons/meulinkbio/v2/${name}.webp`;

function catalogPresetName(label: string): ReactNode {
  switch (label) {
    case 'Spotify':
      return <Trans message="Spotify" />;
    case 'Apple Music':
      return <Trans message="Apple Music" />;
    case 'Bandcamp':
      return <Trans message="Bandcamp" />;
    case 'Tidal':
      return <Trans message="Tidal" />;
    case 'Mixcloud':
      return <Trans message="Mixcloud" />;
    case 'Music link':
      return <Trans message="Music link" />;
    case 'Instagram':
      return <Trans message="Instagram" />;
    case 'TikTok':
      return <Trans message="TikTok" />;
    case 'YouTube':
      return <Trans message="YouTube" />;
    case 'X':
      return <Trans message="X" />;
    case 'Bluesky':
      return <Trans message="Bluesky" />;
    case 'Website preview':
      return <Trans message="Website preview" />;
    case 'Facebook':
      return <Trans message="Facebook" />;
    case 'Telegram':
      return <Trans message="Telegram" />;
    case 'Reddit':
      return <Trans message="Reddit" />;
    case 'Snapchat':
      return <Trans message="Snapchat" />;
    case 'Pinterest':
      return <Trans message="Pinterest" />;
    case 'Google Forms':
      return <Trans message="Google Forms" />;
    case 'Typeform':
      return <Trans message="Typeform" />;
    case 'External form':
      return <Trans message="External form" />;
    case 'PDF':
      return <Trans message="PDF" />;
    case 'Spreadsheet':
      return <Trans message="Spreadsheet" />;
    case 'Presentation':
      return <Trans message="Presentation" />;
    case 'File':
      return <Trans message="File" />;
    case 'Rumble':
      return <Trans message="Rumble" />;
    case 'VK Video':
      return <Trans message="VK Video" />;
    case 'Direct video':
      return <Trans message="Direct video" />;
    case 'Allowed video embed':
      return <Trans message="Allowed video embed" />;
    case 'Gallery grid':
      return <Trans message="Gallery grid" />;
    case 'Gallery slider':
      return <Trans message="Gallery slider" />;
    case 'Gallery carousel':
      return <Trans message="Gallery carousel" />;
    case 'Heading':
      return <Trans message="Heading" />;
    case 'Notice':
      return <Trans message="Notice" />;
    case 'Divider':
      return <Trans message="Divider" />;
    default:
      return label;
  }
}

const preset = (
  entry: Omit<WidgetCatalogEntry, 'status' | 'initialConfig'> & {
    initialConfig?: Record<string, unknown>;
  },
): WidgetCatalogEntry => ({
  ...entry,
  initialConfig: entry.initialConfig ?? {},
  status: 'available',
});

const baseEntries = (
  Object.entries(WidgetList) as Array<
    [WidgetType, (typeof WidgetList)[WidgetType]]
  >
)
  .filter(([, definition]) => definition.status !== 'hidden')
  .map(
    ([type, definition]): WidgetCatalogEntry => ({
      id: `widget:${type}`,
      type,
      name: definition.name,
      searchName: definition.label,
      description: definition.description,
      searchDescription: definition.descriptionText,
      category: definition.category,
      image: definition.image,
      keywords: definition.keywords,
      initialConfig: {},
      featured: definition.featured,
      sortOrder: definition.sortOrder,
      status: definition.status,
    }),
  );

const presetEntries: WidgetCatalogEntry[] = [
  ...[
    ['spotify', 'Spotify'],
    ['appleMusic', 'Apple Music'],
    ['bandcamp', 'Bandcamp'],
    ['tidal', 'Tidal'],
    ['mixcloud', 'Mixcloud'],
    ['custom', 'Music link'],
  ].map(([provider, label], index) =>
    preset({
      id: `music:${provider}`,
      type: 'podcastMusic',
      name: catalogPresetName(label),
      searchName: label,
      description: (
        <Trans message="Start a Music Hub release with this service selected." />
      ),
      searchDescription:
        'Start a Music Hub release with this music service selected.',
      category: 'media',
      image: icon('music'),
      keywords: [provider, label, 'music', 'audio', 'streaming', 'musica'],
      initialConfig: {presetProvider: provider},
      featured: index < 2,
      sortOrder: 71 + index,
    }),
  ),
  ...[
    ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'],
    ['youtube', 'YouTube'],
    ['x', 'X'],
    ['bluesky', 'Bluesky'],
    ['other', 'Website preview'],
  ].map(([provider, label], index) =>
    preset({
      id: `embed:${provider}`,
      type: 'embedCollection',
      name: catalogPresetName(label),
      searchName: label,
      description: <Trans message="Add a rich preview for this provider." />,
      searchDescription: 'Add a rich preview for this provider.',
      category: 'media',
      image: icon('integration-puzzle'),
      keywords: [
        provider,
        label,
        'embed',
        'rich link',
        'preview',
        'incorporar',
        'previa',
      ],
      initialConfig: {presetProvider: provider},
      sortOrder: 186 + index,
    }),
  ),
  ...[
    ['facebook', 'Facebook'],
    ['telegram', 'Telegram'],
    ['reddit', 'Reddit'],
    ['snapchat', 'Snapchat'],
    ['pinterest', 'Pinterest'],
  ].map(([network, label], index) =>
    preset({
      id: `social:${network}`,
      type: 'socials',
      name: catalogPresetName(label),
      searchName: label,
      description: <Trans message="Add this network to Social Links." />,
      searchDescription: 'Add this network to Social Links.',
      category: 'social',
      image: icon('share'),
      keywords: [network, label, 'social', 'profile', 'rede social', 'perfil'],
      initialConfig: {presetNetwork: network},
      sortOrder: 21 + index,
    }),
  ),
  ...[
    ['google', 'Google Forms'],
    ['typeform', 'Typeform'],
    ['external', 'External form'],
  ].map(([provider, label], index) =>
    preset({
      id: `form:${provider}`,
      type: 'externalForm',
      name: catalogPresetName(label),
      searchName: label,
      description: <Trans message="Open or safely embed an external form." />,
      searchDescription: 'Open or safely embed an external form.',
      category: 'contact',
      image: icon('webpage'),
      keywords: [provider, label, 'form', 'lead', 'formulario'],
      initialConfig: {
        embedMode: provider === 'external' ? 'link' : 'iframe',
      },
      sortOrder: 321 + index,
    }),
  ),
  ...[
    ['pdf', 'PDF', 'PDF'],
    ['spreadsheet', 'Spreadsheet', 'Spreadsheet'],
    ['presentation', 'Presentation', 'Presentation'],
    ['file', 'File', 'File'],
  ].map(([kind, label, fileLabel], index) =>
    preset({
      id: `document:${kind}`,
      type: 'document',
      name: catalogPresetName(label),
      searchName: label,
      description: <Trans message="Upload or link to this document type." />,
      searchDescription: 'Upload or link to this document type.',
      category: 'text',
      image: icon('webpage'),
      keywords: [kind, label, 'document', 'download', 'arquivo', 'documento'],
      initialConfig: {label: fileLabel, documentKind: kind},
      sortOrder: 281 + index,
    }),
  ),
  ...[
    ['rumble', 'Rumble'],
    ['vk', 'VK Video'],
    ['direct', 'Direct video'],
    ['embed', 'Allowed video embed'],
  ].map(([provider, label], index) =>
    preset({
      id: `video:${provider}`,
      type: 'genericVideo',
      name: catalogPresetName(label),
      searchName: label,
      description: (
        <Trans message="Add a video using the generic video engine." />
      ),
      searchDescription: 'Add a video using the generic video engine.',
      category: 'media',
      image: icon('video'),
      keywords: [provider, label, 'video', 'player', 'embed', 'incorporar'],
      initialConfig: {
        embedMode: provider === 'direct' ? 'link' : 'iframe',
        presentation: provider === 'direct' ? 'embed' : 'featured',
        metadataLabel: label,
      },
      sortOrder: 291 + index,
    }),
  ),
  preset({
    id: 'spotlight:large-link',
    type: 'spotlight',
    name: <Trans message="Large link" />,
    searchName: 'Large link',
    description: (
      <Trans message="A spacious link with image and supporting copy." />
    ),
    searchDescription: 'A spacious link with image and supporting copy.',
    category: 'text',
    image: icon('link'),
    keywords: ['large link', 'big link', 'link grande', 'destaque'],
    initialConfig: {imagePosition: 'left'},
    sortOrder: 361,
  }),
  preset({
    id: 'spotlight:featured-link',
    type: 'spotlight',
    name: <Trans message="Featured link" />,
    searchName: 'Featured link',
    description: (
      <Trans message="Highlight one destination with stronger hierarchy." />
    ),
    searchDescription: 'Highlight one destination with stronger hierarchy.',
    category: 'text',
    image: icon('magic-wand'),
    keywords: ['featured link', 'spotlight', 'link destacado', 'destaque'],
    initialConfig: {imagePosition: 'background'},
    sortOrder: 362,
  }),
  preset({
    id: 'cta:primary',
    type: 'ctaBanner',
    name: <Trans message="Call to action" />,
    searchName: 'Call to action',
    description: <Trans message="Promote one clear next action." />,
    searchDescription: 'Promote one clear next action.',
    category: 'commerce',
    image: icon('megaphone'),
    keywords: ['cta', 'call to action', 'acao', 'chamada', 'banner'],
    initialConfig: {layout: 'split'},
    sortOrder: 371,
  }),
  ...[
    ['grid', 'Gallery grid'],
    ['slide', 'Gallery slider'],
    ['carousel', 'Gallery carousel'],
  ].map(([layout, label], index) =>
    preset({
      id: `gallery:${layout}`,
      type: 'imageGallery',
      name: catalogPresetName(label),
      searchName: label,
      description: <Trans message="Start an image gallery with this layout." />,
      searchDescription: 'Start an image gallery with this layout.',
      category: 'media',
      image: icon('image'),
      keywords: [layout, label, 'gallery', 'images', 'galeria', 'fotos'],
      initialConfig: {layout},
      sortOrder: 191 + index,
    }),
  ),
  preset({
    id: 'contact:public',
    type: 'contactCard',
    name: <Trans message="Public contact" />,
    searchName: 'Public contact',
    description: <Trans message="Show public contact details inline." />,
    searchDescription: 'Show public contact details inline.',
    category: 'contact',
    image: icon('profile-phone'),
    keywords: ['contact', 'public', 'contato publico', 'telefone', 'email'],
    initialConfig: {presentation: 'inline'},
    sortOrder: 221,
  }),
  preset({
    id: 'contact:vcard',
    type: 'contactCard',
    name: <Trans message="vCard contact" />,
    searchName: 'vCard contact',
    description: (
      <Trans message="Let visitors save this contact as a .vcf file." />
    ),
    searchDescription: 'Let visitors save this contact as a .vcf file.',
    category: 'contact',
    image: icon('profile-phone'),
    keywords: ['vcard', 'vcf', 'save contact', 'salvar contato', 'cartao'],
    initialConfig: {presentation: 'business', enableVcard: true},
    sortOrder: 222,
  }),
  ...[
    ['heading', 'Heading'],
    ['notice', 'Notice'],
    ['divider', 'Divider'],
  ].map(([variant, label], index) =>
    preset({
      id: `text:${variant}`,
      type: 'text',
      name: catalogPresetName(label),
      searchName: label,
      description: (
        <Trans message="Add this text presentation without creating a new widget type." />
      ),
      searchDescription:
        'Add this text presentation without creating a new widget type.',
      category: 'text',
      image: icon('text'),
      keywords: [variant, label, 'text', 'texto', 'titulo', 'aviso', 'divisor'],
      initialConfig: {variant},
      sortOrder: 31 + index,
    }),
  ),
];

export const WidgetCatalogEntries: WidgetCatalogEntry[] = [
  ...baseEntries,
  ...presetEntries,
];

export function getWidgetCatalogEntry(id?: string): WidgetCatalogEntry | null {
  return WidgetCatalogEntries.find(entry => entry.id === id) ?? null;
}
