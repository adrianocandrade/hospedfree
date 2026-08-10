import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {BiolinkAiSuggestionButton} from '@app/dashboard/biolink/biolink-editor/ai/biolink-ai-suggestion-button';
import {biolinkProductsIndex} from '@app/gen/biolink-products';
import {
  getBiolinkEmbedMetadata,
  previewBiolinkProductImport,
} from '@app/gen/biolinks';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {
  CollectionItemStyle,
  CollectionCarousel,
  CollectionItems,
  CollectionLayout,
  CollectionLayoutOptions,
  LegacyCollectionLayout,
  collectionLayoutClasses,
  itemStyleCss,
  normalizeCollectionLayout,
  resolveCollectionItemStyle,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/collection-layout';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {VideoPosterGate} from '@app/dashboard/biolink/biolink-editor/content/widgets/video-poster-gate';
import {
  getBiolinkPlaceholderUrl,
  useResilientImageSources,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-media-placeholder';
import {BiolinkSectionFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-fields';
import {BiolinkFileSelector} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-file-selector';
import {shouldShowBiolinkSectionHeading} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-frame';
import {
  getWidgetEditorModeIcon,
  type WidgetEditorMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import {
  SocialsList,
  SocialsType,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {getBiolinkButtonStyle} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {
  WidgetFormActionButtons,
  widgetAdvancedDefaultValues,
  widgetAdvancedPayload,
  type WidgetAdvancedFormFields,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {urlIsValid} from '@app/dashboard/links/utils/url-is-valid';
import {QrCodeRenderer} from '@app/dashboard/qr-codes/qr-code-renderer';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {BiolinkWidgetItem} from '@app/gen/schemas/biolink-widget-item';
import type {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import type {GetBiolinkEmbedMetadata200} from '@app/gen/schemas/get-biolink-embed-metadata200';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {apiClient} from '@common/http/query-client';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {UploadType} from '@app/site-config';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {useQuery} from '@tanstack/react-query';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Button, LinkButton} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {ColorField} from '@ui/color-picker/color-field';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {ImageZoomDialog} from '@ui/overlays/dialog/image-zoom-dialog';
import {SiDiscord} from '@icons-pack/react-simple-icons';
import {
  ArrowRightIcon,
  BadgePercentIcon,
  BarChart3Icon,
  BriefcaseBusinessIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  Clock3Icon,
  ClipboardListIcon,
  ContactIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Gamepad2Icon,
  GraduationCapIcon,
  HandHeartIcon,
  ImageIcon,
  LinkIcon,
  LoaderCircleIcon,
  MailIcon,
  MailPlusIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneCallIcon,
  PlayIcon,
  Music2Icon,
  PlusIcon,
  QrCodeIcon,
  RssIcon,
  SearchIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  StarIcon,
  Trash2Icon,
  UserRoundCheckIcon,
  VideoIcon,
  VoteIcon,
  ZoomInIcon,
} from 'lucide-react';
import {
  CSSProperties,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {UseFormReturn, useFieldArray, useForm, useWatch} from 'react-hook-form';
import {LeafletMap} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/leaflet-map';
import {LocationWidgetFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/location-widget-fields';
import {
  buildMapDestinationUrl,
  type MapDestinationProvider,
  parseCoordinates,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/location-map-utils';

export type NewWidgetType =
  | 'contactForm'
  | 'emailSignup'
  | 'eventRsvp'
  | 'linkedProduct'
  | 'linkedCourse'
  | 'service'
  | 'faq'
  | 'linkCollection'
  | 'embedCollection'
  | 'imageGallery'
  | 'qrCode'
  | 'location'
  | 'contactCard'
  | 'smsSignup'
  | 'poll'
  | 'reviews'
  | 'stats'
  | 'discountCode'
  | 'document'
  | 'genericVideo'
  | 'podcastMusic'
  | 'mobileApp'
  | 'eventList'
  | 'externalForm'
  | 'rssFeed'
  | 'donation'
  | 'discordPresence'
  | 'gamingProfile';

type WidgetConfig = {
  title?: string;
  description?: string;
  showBackground?: boolean;
  buttonLabel?: string;
  successMessage?: string;
  consentText?: string;
  campaign?: string;
  requirePhone?: boolean;
  contactMode?:
    | 'email_required'
    | 'phone_required'
    | 'email_or_phone'
    | 'email_and_phone';
  allowWaitlist?: boolean;
  allowGuests?: boolean;
  maxGuests?: number;
  eventDate?: string;
  layout?: LegacyCollectionLayout | CollectionLayout;
  aspectRatio?: string;
  gridColumns?: number;
  imageZoom?: boolean;
  qrDisplay?: 'card' | 'code' | 'button';
  mapDisplay?: 'button' | 'iframe' | 'modal';
  mapProvider?: MapDestinationProvider;
  boxBackgroundColor?: string;
  boxTextColor?: string;
  productStyle?: ProductStyle;
  itemStyle?: CollectionItemStyle;
  source?: 'legacy' | 'catalog';
  productIds?: number[];
  presentation?:
    | 'standard'
    | 'featured'
    | 'top'
    | 'embed'
    | 'link'
    | 'action'
    | 'inline'
    | 'business';
  coverImage?: string;
  spotifyPresentation?: 'embed' | 'link';
  duration?: string;
  metadataLabel?: string;
  playBehavior?: 'external' | 'inline';
  playButtonMotion?: 'none' | 'pulse';
  previewStyle?: 'compact' | 'comfortable';
  section?: {
    presentation?: 'contained' | 'open';
    showTitle?: boolean;
    icon?: string;
    anchorLabel?: string;
    actionLabel?: string;
    actionUrl?: string;
  };
  blueprintKey?: string;
  value?: string;
  label?: string;
  address?: string;
  url?: string;
  name?: string;
  occupation?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  hours?: string;
  code?: string;
  expiresAt?: string;
  question?: string;
  embedMode?: 'link' | 'iframe';
  showResults?: boolean;
  discordSource?: 'manual' | 'lanyard';
  discordUserId?: string;
  discordUsername?: string;
  discordStatus?: 'online' | 'idle' | 'dnd' | 'offline';
  discordActivity?: string;
  discordUrl?: string;
  gamingSource?: 'manual' | 'steam';
  steamProfileUrl?: string;
  gamerTag?: string;
  currentGame?: string;
  platform?: string;
  rank?: string;
  gamingUrl?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
  documentKind?: 'pdf' | 'spreadsheet' | 'presentation' | 'file';
  enableVcard?: boolean;
  pixEnabled?: boolean;
  pixKeyType?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  pixKey?: string;
  pixReceiverName?: string;
  pixReceiverCity?: string;
  pixAmount?: number | string | null;
  pixDescription?: string;
  pixTxid?: string;
  pixPayload?: string;
};

type ProductStyle = CollectionItemStyle & {
  cardVariant?: 'standard' | 'media' | 'compact' | 'poster' | 'minimal';
  imagePosition?: 'left' | 'top';
  imageSize?: 'small' | 'medium' | 'large';
  imageRadius?: number;
  showImages?: boolean;
  showImageFallback?: boolean;
  showBackground?: boolean;
  cardTransparency?: number;
  cardBorderWidth?: number;
  cardGlow?: boolean;
  pricePosition?: 'inline' | 'right' | 'below';
  actionStyle?: 'button' | 'icon' | 'text';
};

type PublicPollResult = {
  widget_id: number;
  title: string;
  total_votes: number;
  options: {
    label: string;
    votes: number;
    percentage: number;
  }[];
};

type PublicPollSubmissionResponse = {
  poll_results?: PublicPollResult | null;
};

export type ConfigurableWidget = Omit<
  BiolinkWidget,
  'config' | 'items' | 'type'
> & {
  type: NewWidgetType;
  config: WidgetConfig;
  items?: BiolinkWidgetItem[];
  catalog_items?: Array<{
    id: string | number;
    biolink_id: string | number;
    name: string;
    description?: string | null;
    image?: string | null;
    price?: string | number | null;
    compare_price?: string | number | null;
    currency?: string | null;
    badge?: string | null;
    rating?: string | number | null;
    stock_label?: string | null;
    url?: string | null;
    active?: boolean | string;
  }>;
  password?: string | null;
  activates_at?: string | null;
  expires_at?: string | null;
  utm?: string | null;
  pixels?: {id: number; name?: string}[];
  rules?: {
    id?: number;
    type: string;
    key?: string | null;
    value?: string | null;
  }[];
};

type DialogProps = {
  widget?: ConfigurableWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
  initialItems?: Array<Record<string, unknown>>;
  catalogEntryId?: string;
};

function widgetDialogTitle(mode: WidgetEditorMode, fallback: ReactNode) {
  if (mode === 'design') {
    return <Trans message="Design and layout" />;
  }
  if (mode === 'presentation') {
    return <Trans message="Presentation" />;
  }
  if (mode === 'advanced') {
    return <Trans message="Details and advanced settings" />;
  }
  return fallback;
}

function WidgetDialogIcon({
  mode,
  fallback,
}: {
  mode: WidgetEditorMode;
  fallback: ReactNode;
}) {
  if (mode === 'content') {
    return fallback;
  }

  const ModeIcon = getWidgetEditorModeIcon(mode);
  return <ModeIcon />;
}

function WidgetDialogDescription({mode}: {mode: WidgetEditorMode}) {
  if (mode === 'design') {
    return (
      <Dialog.Description>
        <Trans message="Adjust the collection layout, card style and visual treatment." />
      </Dialog.Description>
    );
  }
  if (mode === 'presentation') {
    return (
      <Dialog.Description>
        <Trans message="Choose how this widget is presented on the public page." />
      </Dialog.Description>
    );
  }
  if (mode === 'advanced') {
    return (
      <Dialog.Description>
        <Trans message="Optional labels, navigation, access and measurement settings." />
      </Dialog.Description>
    );
  }
  return null;
}

type ItemFormValue = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  price?: number | string | null;
  currency?: string;
  active?: boolean;
  type?: string;
  payload?: Record<string, unknown>;
};

type ItemWidgetFormValue = {
  config: ConfigurableWidget['config'];
  items: ItemFormValue[];
} & WidgetAdvancedFormFields;

type CaptureWidgetFormValue = WidgetConfig & WidgetAdvancedFormFields;

export type SimpleConfigWidgetFormValue = WidgetConfig &
  WidgetAdvancedFormFields;

const currencies = ['USD', 'BRL', 'EUR', 'GBP', 'CAD', 'AUD'];
const contactModeOptions = [
  {value: 'email_required', label: <Trans message="Email required" />},
  {value: 'phone_required', label: <Trans message="Phone required" />},
  {value: 'email_or_phone', label: <Trans message="Email or phone" />},
  {value: 'email_and_phone', label: <Trans message="Email and phone" />},
] as const;

const offerWidgetTypes = [
  'linkedProduct',
  'linkedCourse',
  'service',
  'donation',
] as string[];

function defaultOfferProductStyle(
  type: NewWidgetType,
): ProductStyle | undefined {
  if (!offerWidgetTypes.includes(type)) {
    return undefined;
  }

  return {
    cardVariant: 'poster',
    imagePosition: 'top',
    imageSize: 'large',
    imageRadius: 0,
    showImages: true,
    showImageFallback: true,
    showBackground: true,
    cardBorderWidth: 1,
    pricePosition: 'below',
    actionStyle: 'button',
  };
}
const collectionWidgetTypes = [
  ...offerWidgetTypes,
  'linkCollection',
  'embedCollection',
  'imageGallery',
  'reviews',
  'stats',
  'podcastMusic',
  'mobileApp',
  'eventList',
];
const mediaItemWidgetTypes = [
  'linkedProduct',
  'linkedCourse',
  'service',
  'embedCollection',
  'imageGallery',
  'reviews',
  'podcastMusic',
  'mobileApp',
  'eventList',
  'donation',
];

const itemWidgetTypes = [
  'linkedProduct',
  'linkedCourse',
  'service',
  'faq',
  'linkCollection',
  'embedCollection',
  'imageGallery',
  'poll',
  'reviews',
  'stats',
  'podcastMusic',
  'mobileApp',
  'eventList',
  'donation',
] satisfies NewWidgetType[];

type ItemWidgetType = (typeof itemWidgetTypes)[number];

const itemWidgetConfigKeys: Record<ItemWidgetType, (keyof WidgetConfig)[]> = {
  linkedProduct: [
    'title',
    'description',
    'buttonLabel',
    'layout',
    'source',
    'productIds',
    'boxBackgroundColor',
    'boxTextColor',
    'productStyle',
    'itemStyle',
  ],
  linkedCourse: [
    'title',
    'description',
    'buttonLabel',
    'layout',
    'boxBackgroundColor',
    'boxTextColor',
    'productStyle',
    'itemStyle',
  ],
  service: [
    'title',
    'description',
    'buttonLabel',
    'layout',
    'boxBackgroundColor',
    'boxTextColor',
    'productStyle',
    'itemStyle',
  ],
  faq: ['title', 'description'],
  linkCollection: ['title', 'description', 'layout', 'itemStyle'],
  embedCollection: [
    'title',
    'description',
    'layout',
    'previewStyle',
    'itemStyle',
  ],
  imageGallery: [
    'title',
    'description',
    'layout',
    'aspectRatio',
    'gridColumns',
    'imageZoom',
    'itemStyle',
  ],
  poll: [
    'title',
    'description',
    'question',
    'buttonLabel',
    'successMessage',
    'consentText',
    'showResults',
  ],
  reviews: ['title', 'description', 'layout', 'itemStyle'],
  stats: ['title', 'description', 'layout', 'itemStyle'],
  podcastMusic: [
    'title',
    'description',
    'coverImage',
    'spotifyPresentation',
    'itemStyle',
  ],
  mobileApp: ['title', 'description', 'buttonLabel', 'layout', 'itemStyle'],
  eventList: ['title', 'description', 'buttonLabel', 'layout', 'itemStyle'],
  donation: [
    'title',
    'description',
    'buttonLabel',
    'layout',
    'boxBackgroundColor',
    'boxTextColor',
    'productStyle',
    'itemStyle',
    'pixEnabled',
    'pixKeyType',
    'pixKey',
    'pixReceiverName',
    'pixReceiverCity',
    'pixAmount',
    'pixDescription',
    'pixTxid',
  ],
};

const simpleWidgetTypes = [
  'qrCode',
  'location',
  'contactCard',
  'discountCode',
  'document',
  'genericVideo',
  'externalForm',
  'rssFeed',
  'discordPresence',
  'gamingProfile',
] satisfies NewWidgetType[];

const outlineButtonVariants = new Set([
  'outline',
  'outline-shadow',
  'dashed',
  'underline',
  'top-bottom-line',
]);

function PublicActionButton({
  appearance,
  icon,
  title,
  description,
  onClick,
  href,
  className,
  inSurface = false,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  icon: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  inSurface?: boolean;
}) {
  const btnConfig = appearance?.btnConfig;
  const variant = btnConfig?.variant ?? 'solid';
  const isOutline = outlineButtonVariants.has(String(variant));
  const hasTextColor = !!btnConfig?.textColor;
  const hasBackgroundColor = !!btnConfig?.color;

  const sharedProps = {
    className: cn(
      'biolink-btn-custom biolink-public-action relative grid min-h-14 w-full min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3 overflow-hidden border px-4 py-3 text-center text-sm font-semibold wrap-break-word hyphens-auto whitespace-normal no-underline transition-all duration-300 outline-none select-none hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring active:scale-[0.98]',
      btnConfig?.radius ?? 'rounded-sm',
      !hasBackgroundColor &&
        (isOutline ? 'border-primary' : 'border-primary bg-primary'),
      !hasTextColor && (isOutline ? 'text-primary' : 'text-primary-foreground'),
      inSurface && 'biolink-surface-item',
      className,
    ),
    style: getBiolinkButtonStyle({btnConfig}),
  };
  const content = (
    <>
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-current/10 [&_svg:not([class*='size-'])]:size-4.5">
        {icon}
      </span>
      <span className="relative z-10 min-w-0 flex-1">
        {title ? (
          <span className="block leading-5 wrap-break-word">{title}</span>
        ) : null}
        {description ? (
          <span
            className={cn(
              'line-clamp-2 block text-xs leading-4 opacity-75',
              title && 'mt-0.5',
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
      <ArrowRightIcon className="relative z-10 size-4 justify-self-end opacity-65" />
    </>
  );

  if (href) {
    return (
      <a {...sharedProps} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button {...sharedProps} type="button" onClick={onClick}>
      {content}
    </button>
  );
}

const widgetCopy: Record<
  NewWidgetType,
  {
    title: ReactNode;
    icon: ReactNode;
    defaultTitle: MessageDescriptor;
    defaultButton?: MessageDescriptor;
    defaultSuccess?: MessageDescriptor;
  }
> = {
  contactForm: {
    title: <Trans message="Contact form" />,
    icon: <ContactIcon />,
    defaultTitle: message('Contact me'),
    defaultButton: message('Send message'),
    defaultSuccess: message('Message sent. Thank you!'),
  },
  emailSignup: {
    title: <Trans message="Email signup" />,
    icon: <MailPlusIcon />,
    defaultTitle: message('Join my list'),
    defaultButton: message('Subscribe'),
    defaultSuccess: message('You are subscribed.'),
  },
  eventRsvp: {
    title: <Trans message="Event RSVP" />,
    icon: <CalendarCheckIcon />,
    defaultTitle: message('RSVP'),
    defaultButton: message('Send RSVP'),
    defaultSuccess: message('Your response was saved.'),
  },
  linkedProduct: {
    title: <Trans message="Products" />,
    icon: <ShoppingBagIcon />,
    defaultTitle: message('Products'),
    defaultButton: message('View product'),
  },
  linkedCourse: {
    title: <Trans message="Linked course" />,
    icon: <GraduationCapIcon />,
    defaultTitle: message('Courses'),
    defaultButton: message('View course'),
  },
  service: {
    title: <Trans message="Service / Hire me" />,
    icon: <UserRoundCheckIcon />,
    defaultTitle: message('Work with me'),
    defaultButton: message('Request service'),
  },
  faq: {
    title: <Trans message="FAQ" />,
    icon: <CircleHelpIcon />,
    defaultTitle: message('FAQ'),
  },
  linkCollection: {
    title: <Trans message="Link collection" />,
    icon: <LinkIcon />,
    defaultTitle: message('Links'),
  },
  embedCollection: {
    title: <Trans message="Rich embeds" />,
    icon: <LinkIcon />,
    defaultTitle: message('Featured links'),
  },
  imageGallery: {
    title: <Trans message="Image gallery" />,
    icon: <ImageIcon />,
    defaultTitle: message('Gallery'),
  },
  qrCode: {
    title: <Trans message="QR code card" />,
    icon: <QrCodeIcon />,
    defaultTitle: message('Scan this QR code'),
  },
  location: {
    title: <Trans message="Location / Map" />,
    icon: <MapPinIcon />,
    defaultTitle: message('Location'),
    defaultButton: message('Open map'),
  },
  contactCard: {
    title: <Trans message="Contact card" />,
    icon: <ContactIcon />,
    defaultTitle: message('Contact details'),
    defaultButton: message('Contact'),
  },
  smsSignup: {
    title: <Trans message="SMS signup" />,
    icon: <PhoneCallIcon />,
    defaultTitle: message('Join by SMS'),
    defaultButton: message('Subscribe'),
    defaultSuccess: message('You are subscribed.'),
  },
  poll: {
    title: <Trans message="Poll" />,
    icon: <VoteIcon />,
    defaultTitle: message('Poll'),
    defaultButton: message('Vote'),
    defaultSuccess: message('Your vote was saved.'),
  },
  reviews: {
    title: <Trans message="Reviews" />,
    icon: <StarIcon />,
    defaultTitle: message('Reviews'),
  },
  stats: {
    title: <Trans message="Stats" />,
    icon: <BarChart3Icon />,
    defaultTitle: message('Stats'),
  },
  discountCode: {
    title: <Trans message="Discount code" />,
    icon: <BadgePercentIcon />,
    defaultTitle: message('Discount code'),
    defaultButton: message('Copy code'),
  },
  document: {
    title: <Trans message="Document / PDF" />,
    icon: <FileTextIcon />,
    defaultTitle: message('Document'),
    defaultButton: message('Open document'),
  },
  genericVideo: {
    title: <Trans message="Generic video" />,
    icon: <VideoIcon />,
    defaultTitle: message('Video'),
    defaultButton: message('Open video'),
  },
  podcastMusic: {
    title: <Trans message="Music Hub" />,
    icon: <Music2Icon />,
    defaultTitle: message('Music Hub'),
    defaultButton: message('Listen now'),
  },
  mobileApp: {
    title: <Trans message="Mobile app" />,
    icon: <SmartphoneIcon />,
    defaultTitle: message('Get the app'),
    defaultButton: message('Open'),
  },
  eventList: {
    title: <Trans message="Event list" />,
    icon: <CalendarDaysIcon />,
    defaultTitle: message('Events'),
    defaultButton: message('View event'),
  },
  externalForm: {
    title: <Trans message="External form" />,
    icon: <ClipboardListIcon />,
    defaultTitle: message('Form'),
    defaultButton: message('Open form'),
  },
  rssFeed: {
    title: <Trans message="RSS feed" />,
    icon: <RssIcon />,
    defaultTitle: message('Latest posts'),
    defaultButton: message('Open feed'),
  },
  discordPresence: {
    title: <Trans message="Discord presence" />,
    icon: <SiDiscord />,
    defaultTitle: message('Discord'),
    defaultButton: message('Join Discord'),
  },
  gamingProfile: {
    title: <Trans message="Gaming profile" />,
    icon: <Gamepad2Icon />,
    defaultTitle: message('Gaming profile'),
    defaultButton: message('View profile'),
  },
  donation: {
    title: <Trans message="Donation / Fundraising" />,
    icon: <HandHeartIcon />,
    defaultTitle: message('Support my work'),
    defaultButton: message('Support'),
  },
};

function WidgetDefaultText({
  value,
  fallback,
}: {
  value?: string | null;
  fallback: MessageDescriptor;
}) {
  return value || <Trans {...fallback} />;
}

function translatedWidgetText(
  value: string | null | undefined,
  fallback: MessageDescriptor | undefined,
  trans: (descriptor: MessageDescriptor) => string,
): string {
  return value || (fallback ? trans(fallback) : '');
}

function stripWidgetCopyDefaults<T extends WidgetConfig>(
  config: T,
  copy: (typeof widgetCopy)[NewWidgetType],
  trans: (descriptor: MessageDescriptor) => string,
): T {
  const normalized = {...config};
  const defaults: Array<
    [
      keyof Pick<WidgetConfig, 'title' | 'buttonLabel' | 'successMessage'>,
      MessageDescriptor | undefined,
    ]
  > = [
    ['title', copy.defaultTitle],
    ['buttonLabel', copy.defaultButton],
    ['successMessage', copy.defaultSuccess],
  ];

  for (const [field, descriptor] of defaults) {
    const value = normalized[field];
    if (
      descriptor &&
      (value === descriptor.message || value === trans(descriptor))
    ) {
      delete normalized[field];
    }
  }

  const consent = message(
    'I agree to share this information with the page owner.',
  );
  if (
    normalized.consentText === consent.message ||
    normalized.consentText === trans(consent)
  ) {
    delete normalized.consentText;
  }

  return normalized;
}

export function ContactFormWidgetDialog(props: DialogProps) {
  return <CaptureWidgetDialog {...props} type="contactForm" />;
}

export function EmailSignupWidgetDialog(props: DialogProps) {
  return <CaptureWidgetDialog {...props} type="emailSignup" />;
}

export function EventRsvpWidgetDialog(props: DialogProps) {
  return <CaptureWidgetDialog {...props} type="eventRsvp" />;
}

export function LinkedProductWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="linkedProduct" />;
}

export function LinkedCourseWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="linkedCourse" />;
}

export function ServiceWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="service" />;
}

export function FaqWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="faq" />;
}

export function LinkCollectionWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="linkCollection" />;
}

export function EmbedCollectionWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="embedCollection" />;
}

export function ImageGalleryWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="imageGallery" />;
}

export function QrCodeWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="qrCode" />;
}

export function LocationWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="location" />;
}

export function ContactCardWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="contactCard" />;
}

export function SmsSignupWidgetDialog(props: DialogProps) {
  return <CaptureWidgetDialog {...props} type="smsSignup" />;
}

export function PollWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="poll" />;
}

export function ReviewsWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="reviews" />;
}

export function StatsWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="stats" />;
}

export function DiscountCodeWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="discountCode" />;
}

export function DocumentWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="document" />;
}

export function GenericVideoWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="genericVideo" />;
}

export function MobileAppWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="mobileApp" />;
}

export function EventListWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="eventList" />;
}

export function ExternalFormWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="externalForm" />;
}

export function RssFeedWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="rssFeed" />;
}

export function DiscordPresenceWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="discordPresence" />;
}

export function GamingProfileWidgetDialog(props: DialogProps) {
  return <SimpleConfigWidgetDialog {...props} type="gamingProfile" />;
}

export function DonationWidgetDialog(props: DialogProps) {
  return <ItemListWidgetDialog {...props} type="donation" />;
}

function CaptureWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  type,
  mode = 'content',
}: DialogProps & {
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >;
}) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <CaptureWidgetDialogContent
          type={type}
          widget={widget}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CaptureWidgetDialogContent({
  widget,
  type,
  mode,
  onClose,
}: {
  widget?: ConfigurableWidget;
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >;
  mode: WidgetEditorMode;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {trans} = useTrans();
  const copy = widgetCopy[type];
  const form = useForm<CaptureWidgetFormValue>({
    defaultValues: {
      title: widget?.config?.title || trans(copy.defaultTitle),
      description: widget?.config?.description ?? '',
      buttonLabel:
        widget?.config?.buttonLabel ||
        (copy.defaultButton ? trans(copy.defaultButton) : ''),
      successMessage:
        widget?.config?.successMessage ||
        (copy.defaultSuccess ? trans(copy.defaultSuccess) : ''),
      consentText:
        widget?.config?.consentText ||
        trans(
          message('I agree to share this information with the page owner.'),
        ),
      requirePhone: widget?.config?.requirePhone ?? false,
      contactMode: widget?.config?.contactMode ?? 'email_required',
      allowWaitlist: widget?.config?.allowWaitlist ?? true,
      allowGuests: widget?.config?.allowGuests ?? false,
      maxGuests: widget?.config?.maxGuests ?? 0,
      eventDate: widget?.config?.eventDate ?? '',
      campaign: widget?.config?.campaign ?? '',
      section: widget?.config?.section,
      blueprintKey: widget?.config?.blueprintKey,
      presentation:
        widget?.config?.presentation ??
        (type === 'emailSignup' || type === 'smsSignup' ? 'action' : undefined),
      ...widgetAdvancedDefaultValues(widget),
    },
  });
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);

  return (
    <HookForm.Root
      form={form}
      onSubmit={values => {
        crupdateWidget.mutate(
          {
            ...widgetAdvancedPayload(values),
            config: stripWidgetCopyDefaults(
              normalizeCaptureConfig(type, values),
              copy,
              trans,
            ),
            type,
          },
          {
            onSuccess: () => onClose(),
            onError: err => onFormQueryError(err, form),
          },
        );
      }}
    >
      <Dialog.Content className="sm:max-w-3xl">
        <Dialog.Header>
          <Dialog.Title>
            <WidgetDialogIcon mode={mode} fallback={copy.icon} />
            {widgetDialogTitle(mode, copy.title)}
          </Dialog.Title>
          <WidgetDialogDescription mode={mode} />
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            {mode === 'content' ? <CaptureBasicsFields type={type} /> : null}
            {mode === 'presentation' ? (
              <CaptureAppearanceFields type={type} />
            ) : null}
            {mode === 'advanced' ? (
              <CaptureAdvancedFields form={form} type={type} />
            ) : null}
          </Field.Group>
        </Dialog.Body>
        <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
          <WidgetFormActionButtons form={form} widget={widget} />
          <Dialog.CloseButton>
            <Trans message="Cancel" />
          </Dialog.CloseButton>
          <Button
            type="submit"
            disabled={
              crupdateWidget.isPending || (!!widget && !form.formState.isDirty)
            }
          >
            {widget ? <Trans message="Update" /> : <Trans message="Add" />}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </HookForm.Root>
  );
}

function CaptureBasicsFields({
  type,
}: {
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >;
}) {
  return (
    <>
      <HookForm.Field name="title">
        <Field.Label>
          <Trans message="Title" />
        </Field.Label>
        <Input required autoFocus />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="description">
        <Field.Label>
          <Trans message="Description (optional)" />
        </Field.Label>
        <Textarea rows={2} />
        <Field.Error />
      </HookForm.Field>
      {type === 'eventRsvp' ? (
        <HookForm.Field name="eventDate">
          <Field.Label>
            <Trans message="Event date (optional)" />
          </Field.Label>
          <Input type="date" />
          <Field.Error />
        </HookForm.Field>
      ) : null}
      <HookForm.Field name="buttonLabel">
        <Field.Label>
          <Trans message="Button label" />
        </Field.Label>
        <Input required />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}

function CaptureAppearanceFields({
  type,
}: {
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >;
}) {
  return (
    <>
      {type === 'emailSignup' || type === 'smsSignup' ? (
        <HookForm.Field name="presentation">
          <Field.Label>
            <Trans message="Presentation" />
          </Field.Label>
          <Select.Root
            items={[
              {
                value: 'action',
                label: <Trans message="Open from action" />,
              },
              {value: 'inline', label: <Trans message="Inline form" />},
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="action">
                <Trans message="Open from action" />
              </Select.Item>
              <Select.Item value="inline">
                <Trans message="Inline form" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Description>
            <Trans message="Use an action for a compact page or inline when signup is the main goal." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}
    </>
  );
}

function CaptureAdvancedFields({
  form,
  type,
}: {
  form: UseFormReturn<CaptureWidgetFormValue>;
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >;
}) {
  const allowGuests = useWatch({
    control: form.control,
    name: 'allowGuests',
  });

  return (
    <>
      {type === 'contactForm' || type === 'eventRsvp' ? (
        <HookForm.Field name="contactMode">
          <Field.Label>
            <Trans message="Contact requirement" />
          </Field.Label>
          <Select.Root
            items={contactModeOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {contactModeOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Field.Description>
            <Trans message="Choose whether visitors must provide email, phone or both." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}
      {type === 'eventRsvp' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="allowWaitlist">
            <Field.Label>
              <Trans message="Allow waitlist responses" />
            </Field.Label>
            <Checkbox />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="allowGuests">
            <Field.Label>
              <Trans message="Allow companions" />
            </Field.Label>
            <Checkbox />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="maxGuests">
            <Field.Label>
              <Trans message="Companion limit" />
            </Field.Label>
            <Input type="number" min="0" max="10" disabled={!allowGuests} />
            <Field.Description>
              <Trans message="Maximum of 10 companions per response." />
            </Field.Description>
            <Field.Error />
          </HookForm.Field>
        </div>
      ) : null}
      {type === 'emailSignup' || type === 'smsSignup' ? (
        <HookForm.Field name="campaign">
          <Field.Label>
            <Trans message="Campaign (optional)" />
          </Field.Label>
          <Input />
          <Field.Description>
            <Trans message="Saved with each submission to identify the signup source." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}
      <HookForm.Field name="successMessage">
        <Field.Label>
          <Trans message="Success message" />
        </Field.Label>
        <Input required />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="consentText">
        <Field.Label>
          <Trans message="Consent text" />
        </Field.Label>
        <Textarea rows={2} required />
        <Field.Error />
      </HookForm.Field>
      <BiolinkSectionFields />
    </>
  );
}

function DonationPixFields({form}: {form: UseFormReturn<ItemWidgetFormValue>}) {
  const enabled = form.watch('config.pixEnabled') ?? false;
  return (
    <div className="space-y-4 rounded-card-sm border p-4">
      <HookForm.Field name="config.pixEnabled">
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          <span>
            <span className="block font-medium">
              <Trans message="Accept Pix" />
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              <Trans message="Generate a static Pix QR code. MeuLinkBio does not process or hold funds." />
            </span>
          </span>
          <Checkbox bindToHookForm />
        </label>
        <Field.Error />
      </HookForm.Field>
      {enabled ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <HookForm.Field name="config.pixKeyType">
              <Field.Label>
                <Trans message="Pix key type" />
              </Field.Label>
              <Select.Root
                items={[
                  {value: 'cpf', label: <Trans message="CPF" />},
                  {value: 'cnpj', label: <Trans message="CNPJ" />},
                  {value: 'phone', label: <Trans message="Phone" />},
                  {value: 'email', label: <Trans message="Email" />},
                  {value: 'random', label: <Trans message="Random key" />},
                ]}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="cpf">
                    <Trans message="CPF" />
                  </Select.Item>
                  <Select.Item value="cnpj">
                    <Trans message="CNPJ" />
                  </Select.Item>
                  <Select.Item value="phone">
                    <Trans message="Phone" />
                  </Select.Item>
                  <Select.Item value="email">
                    <Trans message="Email" />
                  </Select.Item>
                  <Select.Item value="random">
                    <Trans message="Random key" />
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="config.pixKey">
              <Field.Label>
                <Trans message="Pix key" />
              </Field.Label>
              <Input required />
              <Field.Error />
            </HookForm.Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HookForm.Field name="config.pixReceiverName">
              <Field.Label>
                <Trans message="Receiver name" />
              </Field.Label>
              <Input required maxLength={25} />
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="config.pixReceiverCity">
              <Field.Label>
                <Trans message="Receiver city" />
              </Field.Label>
              <Input required maxLength={15} />
              <Field.Error />
            </HookForm.Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HookForm.Field name="config.pixAmount">
              <Field.Label>
                <Trans message="Amount (optional)" />
              </Field.Label>
              <Input type="number" min="0.01" step="0.01" inputMode="decimal" />
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="config.pixTxid">
              <Field.Label>
                <Trans message="TxID" />
              </Field.Label>
              <Input maxLength={25} />
              <Field.Error />
            </HookForm.Field>
          </div>
          <HookForm.Field name="config.pixDescription">
            <Field.Label>
              <Trans message="Pix description (optional)" />
            </Field.Label>
            <Input maxLength={30} />
            <Field.Error />
          </HookForm.Field>
        </>
      ) : null}
    </div>
  );
}

function ItemListWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  type,
  mode = 'content',
  initialConfig,
  initialItems,
}: DialogProps & {type: ItemWidgetType}) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <ItemListWidgetDialogContent
          type={type}
          widget={widget}
          mode={mode}
          initialConfig={initialConfig}
          initialItems={initialItems}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ItemListWidgetDialogContent({
  widget,
  type,
  mode,
  initialConfig,
  initialItems,
  onClose,
}: {
  widget?: ConfigurableWidget;
  type: ItemWidgetType;
  mode: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
  initialItems?: Array<Record<string, unknown>>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const copy = widgetCopy[type];
  const isOfferWidget = offerWidgetTypes.includes(type);
  const isPollWidget = type === 'poll';
  const isEmbedWidget = type === 'embedCollection';
  const usesCatalogProducts = type === 'linkedProduct';
  const {trans} = useTrans();
  const usesButtonLabel = itemWidgetConfigKeys[type].includes('buttonLabel');
  const form = useForm<ItemWidgetFormValue>({
    defaultValues: {
      config: {
        ...(initialConfig as WidgetConfig | undefined),
        title:
          widget?.config?.title ||
          (initialConfig?.title as string | undefined) ||
          trans(copy.defaultTitle),
        description:
          widget?.config?.description ??
          (initialConfig?.description as string | undefined) ??
          '',
        question: widget?.config?.question ?? '',
        buttonLabel:
          widget?.config?.buttonLabel ||
          (copy.defaultButton ? trans(copy.defaultButton) : ''),
        successMessage:
          widget?.config?.successMessage ||
          (copy.defaultSuccess ? trans(copy.defaultSuccess) : ''),
        consentText:
          widget?.config?.consentText ||
          trans(
            message('I agree to share this information with the page owner.'),
          ),
        showBackground: widget?.config?.showBackground ?? true,
        showResults: widget?.config?.showResults ?? true,
        layout:
          widget?.config?.layout ??
          (initialConfig?.layout as WidgetConfig['layout']) ??
          (type === 'eventList'
            ? 'timeline'
            : isOfferWidget
              ? 'grid'
              : 'classic'),
        imageZoom: widget?.config?.imageZoom ?? true,
        boxBackgroundColor: widget?.config?.boxBackgroundColor ?? '',
        boxTextColor: widget?.config?.boxTextColor ?? '',
        productStyle:
          widget?.config?.productStyle ?? defaultOfferProductStyle(type),
        itemStyle: widget?.config?.itemStyle,
        source: type === 'linkedProduct' ? 'catalog' : undefined,
        productIds: widget?.config?.productIds ?? [],
        presentation: widget?.config?.presentation ?? 'standard',
        previewStyle: widget?.config?.previewStyle ?? 'compact',
        section: widget?.config?.section,
        blueprintKey: widget?.config?.blueprintKey,
        pixEnabled: widget?.config?.pixEnabled ?? false,
        pixKeyType: widget?.config?.pixKeyType ?? 'random',
        pixKey: widget?.config?.pixKey ?? '',
        pixReceiverName: widget?.config?.pixReceiverName ?? '',
        pixReceiverCity: widget?.config?.pixReceiverCity ?? '',
        pixAmount: widget?.config?.pixAmount ?? '',
        pixDescription: widget?.config?.pixDescription ?? '',
        pixTxid: widget?.config?.pixTxid ?? '',
      },
      items: normalizeItemsForForm(
        widget?.items ??
          (initialItems as ItemFormValue[] | undefined) ??
          initialPresetItems(type, initialConfig),
        isOfferWidget || isPollWidget || isEmbedWidget,
      ),
      ...widgetAdvancedDefaultValues(widget),
    },
  });
  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const [removingItemIndex, setRemovingItemIndex] = useState<number | null>(
    null,
  );
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const usesMedia = mediaItemWidgetTypes.includes(type);
  const catalogProducts = useQuery({
    queryKey: ['biolink-products', Number(biolinkId)],
    queryFn: () => biolinkProductsIndex(Number(biolinkId)),
    enabled: usesCatalogProducts,
  });
  const [catalogSearch, setCatalogSearch] = useState('');
  const filteredCatalogProducts = useMemo(() => {
    const search = catalogSearch.trim().toLocaleLowerCase();
    const products = catalogProducts.data?.data ?? [];

    if (!search) {
      return products;
    }

    return products.filter(product =>
      [product.name, product.description, product.price, product.currency]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [catalogProducts.data?.data, catalogSearch]);

  useEffect(() => {
    if (
      !usesCatalogProducts &&
      !widget &&
      isOfferWidget &&
      type !== 'donation' &&
      fields.length === 0
    ) {
      setCreatingItem(true);
    }
  }, [fields.length, isOfferWidget, type, usesCatalogProducts, widget]);

  return (
    <FileUploadProvider>
      <HookForm.Root
        form={form}
        onSubmit={values => {
          crupdateWidget.mutate(
            {
              ...widgetAdvancedPayload(values),
              config: stripWidgetCopyDefaults(
                normalizeItemWidgetConfig(type, values.config),
                copy,
                trans,
              ),
              items: values.items,
              type,
            },
            {
              onSuccess: () => onClose(),
              onError: err => onFormQueryError(err, form),
            },
          );
        }}
      >
        <Dialog.Content className="sm:max-w-4xl">
          <Dialog.Header>
            <Dialog.Title>
              <WidgetDialogIcon mode={mode} fallback={copy.icon} />
              {widgetDialogTitle(mode, copy.title)}
            </Dialog.Title>
            <WidgetDialogDescription mode={mode} />
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              {mode === 'content' ? (
                <>
                  <HookForm.Field name="config.title">
                    <div className="flex min-h-8 items-center justify-between gap-3">
                      <Field.Label>
                        <Trans message="Section title" />
                      </Field.Label>
                      <BiolinkAiSuggestionButton
                        biolinkId={biolinkId}
                        purpose={
                          type === 'linkedProduct'
                            ? 'product'
                            : type === 'service'
                              ? 'service'
                              : 'title'
                        }
                        value={form.watch('config.title')}
                        onApply={suggestion =>
                          form.setValue('config.title', suggestion, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>
                    <Input required autoFocus />
                    <Field.Error />
                  </HookForm.Field>
                  {type === 'donation' ? (
                    <DonationPixFields form={form} />
                  ) : null}
                </>
              ) : null}
              {mode === 'design' ? (
                <>
                  {collectionWidgetTypes.includes(type) ? (
                    <HookForm.Field name="config.layout">
                      <Field.Label>
                        <Trans message="Layout" />
                      </Field.Label>
                      <CollectionLayoutOptions
                        ariaLabel={trans(message('Collection layout'))}
                        columns={
                          isOfferWidget
                            ? 'grid-cols-2 sm:grid-cols-3'
                            : undefined
                        }
                        hiddenLayouts={
                          type === 'linkedProduct' ? ['line'] : undefined
                        }
                        value={form.watch('config.layout')}
                        onChange={value =>
                          form.setValue('config.layout', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  {isEmbedWidget ? (
                    <HookForm.Field name="config.previewStyle">
                      <Field.Label>
                        <Trans message="Preview density" />
                      </Field.Label>
                      <VisualOptionGrid
                        ariaLabel={trans(message('Embed preview density'))}
                        columns="grid-cols-2"
                        value={form.watch('config.previewStyle') ?? 'compact'}
                        onChange={value =>
                          form.setValue(
                            'config.previewStyle',
                            value as 'compact' | 'comfortable',
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                        items={[
                          {
                            value: 'compact',
                            label: <Trans message="Compact" />,
                            description: (
                              <Trans message="Dense rows with a square thumbnail." />
                            ),
                            preview: <EmbedDensityPreview density="compact" />,
                            kind: 'thumbnail',
                          },
                          {
                            value: 'comfortable',
                            label: <Trans message="Comfortable" />,
                            description: (
                              <Trans message="More room for titles and descriptions." />
                            ),
                            preview: (
                              <EmbedDensityPreview density="comfortable" />
                            ),
                            kind: 'thumbnail',
                          },
                        ]}
                      />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  {isOfferWidget ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <HookForm.Field name="config.boxBackgroundColor">
                        <Field.Label>
                          <Trans message="Section background" />
                        </Field.Label>
                        <ColorField
                          label={null}
                          value={
                            form.watch('config.boxBackgroundColor') || '#ffffff'
                          }
                          onChange={value => {
                            form.setValue('config.boxBackgroundColor', value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          color="default"
                          size="xs"
                          className="mt-2"
                          onClick={() => {
                            form.setValue('config.boxBackgroundColor', '', {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Trans message="Use theme background" />
                        </Button>
                        <Field.Error />
                      </HookForm.Field>
                      <HookForm.Field name="config.boxTextColor">
                        <Field.Label>
                          <Trans message="Section text" />
                        </Field.Label>
                        <ColorField
                          label={null}
                          value={form.watch('config.boxTextColor') || '#111827'}
                          onChange={value => {
                            form.setValue('config.boxTextColor', value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          color="default"
                          size="xs"
                          className="mt-2"
                          onClick={() => {
                            form.setValue('config.boxTextColor', '', {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Trans message="Use page text" />
                        </Button>
                        <Field.Error />
                      </HookForm.Field>
                    </div>
                  ) : null}
                  {isOfferWidget ? <ProductStyleFields form={form} /> : null}
                </>
              ) : null}
              {mode === 'content' && usesCatalogProducts ? (
                <HookForm.Field name="config.productIds">
                  <Field.Label>
                    <Trans message="Products in this section" />
                  </Field.Label>
                  <p className="text-sm text-muted-foreground">
                    <Trans message="Select products from the Products tab to show them here." />
                  </p>
                  <div className="relative mt-3">
                    <SearchIcon
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      bindToHookForm={false}
                      value={catalogSearch}
                      onChange={event => setCatalogSearch(event.target.value)}
                      className="pl-9"
                      placeholder={trans({message: 'Search...'})}
                    />
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto overscroll-contain pr-1">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {catalogProducts.isLoading
                        ? Array.from({length: 4}, (_, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-card border p-3"
                            >
                              <Skeleton className="size-5 shrink-0" />
                              <span className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-2.5 w-1/3" />
                              </span>
                            </div>
                          ))
                        : null}
                      {filteredCatalogProducts.map(product => {
                        const productId = Number(product.id);
                        const selected = (
                          form.watch('config.productIds') ?? []
                        ).includes(productId);
                        return (
                          <label
                            key={product.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-card border p-3 text-sm',
                              selected && 'border-primary bg-primary/5',
                            )}
                          >
                            <Checkbox
                              bindToHookForm={false}
                              checked={selected}
                              onCheckedChange={checked => {
                                const current =
                                  form.getValues('config.productIds') ?? [];
                                form.setValue(
                                  'config.productIds',
                                  checked
                                    ? [...current, productId]
                                    : current.filter(id => id !== productId),
                                  {shouldDirty: true, shouldValidate: true},
                                );
                              }}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {product.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {product.price ? (
                                  `${product.currency ?? 'BRL'} ${product.price}`
                                ) : (
                                  <Trans message="No price" />
                                )}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                      {catalogProducts.isFetched &&
                      (catalogProducts.data?.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          <Trans message="Create products in the Products tab before adding them here." />
                        </p>
                      ) : null}
                      {catalogProducts.isFetched &&
                      (catalogProducts.data?.data ?? []).length > 0 &&
                      filteredCatalogProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          <Trans message="No products match your search." />
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Field.Error />
                </HookForm.Field>
              ) : null}
              {mode === 'presentation' && type === 'imageGallery' ? (
                <>
                  <HookForm.Field name="config.imageZoom">
                    <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
                      <span>
                        <span className="block font-medium">
                          <Trans message="Zoom images" />
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          <Trans message="Open gallery images in a larger viewer." />
                        </span>
                      </span>
                      <Checkbox
                        bindToHookForm={false}
                        checked={form.watch('config.imageZoom') ?? true}
                        onCheckedChange={value =>
                          form.setValue('config.imageZoom', !!value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </label>
                    <Field.Error />
                  </HookForm.Field>

                  {/* Aspect ratio selector — visible for all layouts */}
                  <div>
                    <div className="mb-2 text-sm font-medium">
                      <Trans message="Image proportions" />
                    </div>
                    <VisualOptionGrid
                      ariaLabel={trans(message('Image aspect ratio'))}
                      columns="grid-cols-2 sm:grid-cols-4"
                      value={form.watch('config.aspectRatio') ?? '4/3'}
                      onChange={value =>
                        form.setValue('config.aspectRatio', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      items={[
                        {
                          value: 'square',
                          label: <Trans message="Square" />,
                          description: <Trans message="1:1" />,
                          preview: (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-full max-w-10 fill-none stroke-current text-primary"
                            >
                              <rect
                                x="2"
                                y="2"
                                width="20"
                                height="20"
                                rx="3"
                                fill="currentColor"
                                fillOpacity="0.15"
                              />
                            </svg>
                          ),
                          kind: 'thumbnail',
                        },
                        {
                          value: '4/3',
                          label: <Trans message="Standard" />,
                          description: <Trans message="4:3" />,
                          preview: (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-full max-w-10 fill-none stroke-current text-primary"
                            >
                              <rect
                                x="2"
                                y="4.5"
                                width="20"
                                height="15"
                                rx="3"
                                fill="currentColor"
                                fillOpacity="0.15"
                              />
                            </svg>
                          ),
                          kind: 'thumbnail',
                        },
                        {
                          value: '16/9',
                          label: <Trans message="Wide" />,
                          description: <Trans message="16:9" />,
                          preview: (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-full max-w-10 fill-none stroke-current text-primary"
                            >
                              <rect
                                x="2"
                                y="6.375"
                                width="20"
                                height="11.25"
                                rx="3"
                                fill="currentColor"
                                fillOpacity="0.15"
                              />
                            </svg>
                          ),
                          kind: 'thumbnail',
                        },
                        {
                          value: 'portrait',
                          label: <Trans message="Portrait" />,
                          description: <Trans message="3:4" />,
                          preview: (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-full max-w-10 fill-none stroke-current text-primary"
                            >
                              <rect
                                x="5"
                                y="2"
                                width="14"
                                height="20"
                                rx="3"
                                fill="currentColor"
                                fillOpacity="0.15"
                              />
                            </svg>
                          ),
                          kind: 'thumbnail',
                        },
                      ]}
                    />
                  </div>

                  {/* Column count — visible only when layout = grid */}
                  {normalizeCollectionLayout(form.watch('config.layout')) ===
                  'grid' ? (
                    <div>
                      <div className="mb-2 text-sm font-medium">
                        <Trans message="Columns" />
                      </div>
                      <VisualOptionGrid
                        ariaLabel={trans(message('Gallery columns'))}
                        columns="grid-cols-3"
                        value={String(form.watch('config.gridColumns') ?? '2')}
                        onChange={value =>
                          form.setValue('config.gridColumns', Number(value), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        items={[
                          {
                            value: '1',
                            label: <Trans message="1 col" />,
                            preview: (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-full max-w-12 fill-none stroke-current text-primary"
                              >
                                <rect
                                  x="2"
                                  y="3"
                                  width="20"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="2"
                                  y="13"
                                  width="20"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                              </svg>
                            ),
                            kind: 'thumbnail',
                          },
                          {
                            value: '2',
                            label: <Trans message="2 cols" />,
                            preview: (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-full max-w-12 fill-none stroke-current text-primary"
                              >
                                <rect
                                  x="2"
                                  y="3"
                                  width="9"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="13"
                                  y="3"
                                  width="9"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="2"
                                  y="13"
                                  width="9"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="13"
                                  y="13"
                                  width="9"
                                  height="8"
                                  rx="2"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                              </svg>
                            ),
                            kind: 'thumbnail',
                          },
                          {
                            value: '3',
                            label: <Trans message="3 cols" />,
                            preview: (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-full max-w-12 fill-none stroke-current text-primary"
                              >
                                <rect
                                  x="1"
                                  y="3"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="9"
                                  y="3"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="17"
                                  y="3"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="1"
                                  y="13"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="9"
                                  y="13"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                                <rect
                                  x="17"
                                  y="13"
                                  width="6"
                                  height="8"
                                  rx="1.5"
                                  fill="currentColor"
                                  fillOpacity="0.15"
                                />
                              </svg>
                            ),
                            kind: 'thumbnail',
                          },
                        ]}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
              {mode === 'content' && isPollWidget ? (
                <HookForm.Field name="config.question">
                  <Field.Label>
                    <Trans message="Poll question" />
                  </Field.Label>
                  <Input required />
                  <Field.Error />
                </HookForm.Field>
              ) : null}
              {mode === 'advanced' ? (
                <>
                  <HookForm.Field name="config.description">
                    <Field.Label>
                      <Trans message="Description (optional)" />
                    </Field.Label>
                    <Textarea rows={2} />
                    <Field.Error />
                  </HookForm.Field>
                  {isPollWidget ? (
                    <>
                      <HookForm.Field name="config.showResults">
                        <Field.Label>
                          <Trans message="Show results after voting" />
                        </Field.Label>
                        <Checkbox />
                        <Field.Error />
                      </HookForm.Field>
                      <HookForm.Field name="config.successMessage">
                        <Field.Label>
                          <Trans message="Success message" />
                        </Field.Label>
                        <Input required />
                        <Field.Error />
                      </HookForm.Field>
                      <HookForm.Field name="config.consentText">
                        <Field.Label>
                          <Trans message="Consent text" />
                        </Field.Label>
                        <Textarea rows={2} required />
                        <Field.Error />
                      </HookForm.Field>
                    </>
                  ) : null}
                  {usesButtonLabel ? (
                    <HookForm.Field name="config.buttonLabel">
                      <Field.Label>
                        <Trans message="Button label" />
                      </Field.Label>
                      <Input required />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}

                  <BiolinkSectionFields prefix="config." />
                </>
              ) : null}

              {mode === 'content' && !usesCatalogProducts ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                      <Trans message="Items" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatingItem(true)}
                    >
                      <PlusIcon />
                      <Trans message="Add item" />
                    </Button>
                  </div>
                  {fields.length ? (
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <WidgetItemPreview
                          key={field.id}
                          item={form.getValues(`items.${index}`)}
                          index={index}
                          type={type}
                          onEdit={() => setEditingItemIndex(index)}
                          onRemove={() => setRemovingItemIndex(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-card border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <Trans message="No items have been added yet." />
                    </div>
                  )}
                </div>
              ) : null}
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
            <WidgetFormActionButtons form={form} widget={widget} />
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="submit"
              disabled={
                crupdateWidget.isPending ||
                (!!widget && !form.formState.isDirty)
              }
            >
              {widget ? <Trans message="Update" /> : <Trans message="Add" />}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
      {!usesCatalogProducts ? (
        <WidgetItemEditorDialog
          open={creatingItem || editingItemIndex !== null}
          type={type}
          usesMedia={usesMedia}
          item={
            editingItemIndex !== null
              ? form.getValues(`items.${editingItemIndex}`)
              : emptyItem()
          }
          onOpenChange={open => {
            if (!open) {
              setCreatingItem(false);
              setEditingItemIndex(null);
            }
          }}
          onSubmit={item => {
            if (editingItemIndex !== null) {
              update(editingItemIndex, item);
            } else {
              append(item);
            }
            form.setValue('items', form.getValues('items'), {
              shouldDirty: true,
            });
            setCreatingItem(false);
            setEditingItemIndex(null);
          }}
        />
      ) : null}
      {!usesCatalogProducts ? (
        <RemoveItemDialog
          open={removingItemIndex !== null}
          onOpenChange={open => !open && setRemovingItemIndex(null)}
          onConfirm={() => {
            if (removingItemIndex !== null) {
              remove(removingItemIndex);
              form.setValue('items', form.getValues('items'), {
                shouldDirty: true,
              });
            }
            setRemovingItemIndex(null);
          }}
        />
      ) : null}
    </FileUploadProvider>
  );
}

function WidgetItemPreview({
  item,
  index,
  type,
  onEdit,
  onRemove,
}: {
  item: ItemFormValue;
  index: number;
  type: NewWidgetType;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const price = formatPrice(item.price, item.currency);
  const isFaq = type === 'faq';
  const merchandising = readMerchandising(item.payload);
  const currentPrice = Number(item.price);
  const hasDiscount =
    item.price !== null &&
    item.price !== undefined &&
    item.price !== '' &&
    merchandising.comparePrice !== null &&
    Number.isFinite(currentPrice) &&
    merchandising.comparePrice > currentPrice;
  const comparePrice = hasDiscount
    ? formatPrice(merchandising.comparePrice, item.currency)
    : null;
  const discountPercentage =
    hasDiscount && merchandising.comparePrice
      ? Math.max(
          1,
          Math.round(
            ((merchandising.comparePrice - currentPrice) /
              merchandising.comparePrice) *
              100,
          ),
        )
      : null;

  return (
    <div className="flex items-center gap-3 rounded-card border bg-card p-3">
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="size-14 shrink-0 rounded-input object-cover"
        />
      ) : (
        <div className="grid size-14 shrink-0 place-items-center rounded-input border bg-muted text-muted-foreground">
          {isFaq ? (
            <CircleHelpIcon className="size-5" />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-sm font-medium">
            {item.title || (
              <>
                <Trans message="Item" /> {index + 1}
              </>
            )}
          </div>
          {merchandising.badge ? (
            <span className="max-w-32 shrink-0 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {merchandising.badge}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {isFaq
            ? item.description
            : item.url || item.description || <Trans message="No URL yet" />}
        </div>
        {price ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{price}</span>
            {comparePrice ? (
              <span className="line-through opacity-70">{comparePrice}</span>
            ) : null}
            {discountPercentage !== null ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                -{discountPercentage}%
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        <Trans message="Edit" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
        <Trash2Icon />
      </Button>
    </div>
  );
}

function EmbedDensityPreview({density}: {density: 'compact' | 'comfortable'}) {
  return (
    <span
      className={cn(
        'flex w-full max-w-28 overflow-hidden rounded border border-primary/30 bg-card text-primary',
        density === 'compact' ? 'h-12' : 'h-16',
      )}
    >
      <span
        className={cn(
          'shrink-0 bg-primary/20',
          density === 'compact' ? 'w-12' : 'w-16',
        )}
      />
      <span className="flex flex-1 flex-col justify-center gap-1.5 px-2">
        <span className="h-1.5 w-4/5 rounded bg-current/65" />
        <span className="h-1.5 w-full rounded bg-current/25" />
        <span className="h-1.5 w-2/5 rounded bg-current/35" />
      </span>
    </span>
  );
}

function MapPresentationPreview({
  presentation,
}: {
  presentation: 'button' | 'iframe' | 'modal';
}) {
  if (presentation === 'iframe') {
    return (
      <span className="flex w-full max-w-28 flex-col overflow-hidden rounded border border-primary/30 bg-card shadow-sm">
        <span className="relative flex aspect-video w-full items-center justify-center bg-green-100 dark:bg-green-900/30">
          {/* Map roads mock */}
          <span className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] opacity-20" />
          <MapPinIcon className="relative size-5 text-red-500" />
        </span>
      </span>
    );
  }

  if (presentation === 'modal') {
    return (
      <span className="flex w-full max-w-28 items-center justify-center rounded border border-primary/30 bg-card p-3 shadow-sm">
        <span className="relative flex h-16 w-full items-center justify-center rounded border border-border bg-black/40 shadow-xl backdrop-blur-sm">
          <span className="flex w-3/4 flex-col gap-1 rounded bg-background p-1.5 shadow-sm">
            <span className="h-1.5 w-1/2 rounded bg-foreground/20" />
            <span className="flex aspect-video w-full items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
              <MapPinIcon className="size-3 text-red-500" />
            </span>
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex w-full max-w-28 items-center justify-center gap-2 rounded border border-primary/30 bg-card p-2 shadow-sm transition-transform group-hover:-translate-y-0.5">
      <MapPinIcon className="size-3 text-primary" />
      <span className="h-1.5 w-12 rounded bg-primary/80" />
    </span>
  );
}

// Kept as a compatibility renderer for legacy widget configuration migrations.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CollectionItemStyleFields({
  form,
}: {
  form: UseFormReturn<ItemWidgetFormValue>;
}) {
  const {trans} = useTrans();
  const style = form.watch('config.itemStyle') ?? {};
  const setStyle = <K extends keyof CollectionItemStyle>(
    key: K,
    value: CollectionItemStyle[K] | undefined,
  ) => {
    form.setValue(`config.itemStyle.${key}` as never, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <div className="text-sm font-medium">
          <Trans message="Item appearance" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <Trans message="Customize collection items while keeping the global UI Kit surface." />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label={<Trans message="Item background" />}
          value={style.backgroundColor || '#ffffff'}
          onChange={value => setStyle('backgroundColor', value)}
        />
        <ColorField
          label={<Trans message="Item text" />}
          value={style.textColor || '#111827'}
          onChange={value => setStyle('textColor', value)}
        />
        <ColorField
          label={<Trans message="Item border" />}
          value={style.borderColor || '#111827'}
          onChange={value => setStyle('borderColor', value)}
        />
        <div>
          <ControlLabel>
            <Trans message="Item transparency" />
          </ControlLabel>
          <Input
            type="number"
            min={0}
            max={100}
            value={style.transparency ?? 0}
            onChange={event =>
              setStyle('transparency', Number(event.target.value))
            }
          />
        </div>
      </div>
      <div>
        <ControlLabel>
          <Trans message="Item shadow" />
        </ControlLabel>
        <VisualOptionGrid
          ariaLabel={trans(message('Item shadow'))}
          columns="grid-cols-2 sm:grid-cols-4"
          value={style.shadow ?? 'none'}
          onChange={value =>
            setStyle('shadow', value as CollectionItemStyle['shadow'])
          }
          items={(['none', 'soft', 'strong', 'hard'] as const).map(shadow => ({
            value: shadow,
            label: (
              <Trans
                message={
                  {
                    none: 'None',
                    soft: 'Soft',
                    strong: 'Strong',
                    hard: 'Hard',
                  }[shadow]
                }
              />
            ),
            preview: <ItemShadowPreview shadow={shadow} />,
          }))}
        />
      </div>
      <div>
        <ControlLabel>
          <Trans message="Item border width" />
        </ControlLabel>
        <Input
          type="number"
          min={0}
          max={8}
          value={style.borderWidth ?? 1}
          onChange={event =>
            setStyle('borderWidth', Number(event.target.value))
          }
        />
      </div>
    </div>
  );
}

function ItemShadowPreview({shadow}: {shadow: CollectionItemStyle['shadow']}) {
  return (
    <span
      className="size-8 rounded-md bg-primary"
      style={{
        boxShadow:
          shadow === 'soft'
            ? '0 4px 10px color-mix(in srgb, currentColor 22%, transparent)'
            : shadow === 'strong'
              ? '0 7px 16px color-mix(in srgb, currentColor 32%, transparent)'
              : shadow === 'hard'
                ? '4px 4px 0 color-mix(in srgb, currentColor 55%, transparent)'
                : undefined,
      }}
    />
  );
}

function ProductStyleFields({
  form,
}: {
  form: UseFormReturn<ItemWidgetFormValue>;
}) {
  const {trans} = useTrans();
  const style = form.watch('config.productStyle') ?? {};
  const setStyle = <K extends keyof ProductStyle>(
    key: K,
    value: ProductStyle[K],
  ) => {
    form.setValue(`config.productStyle.${key}` as never, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <div className="text-sm font-medium">
          <Trans message="Appearance" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <ControlLabel>
            <Trans message="Card variant" />
          </ControlLabel>
          <VisualOptionGrid
            ariaLabel={trans(message('Card variant'))}
            columns="grid-cols-2 sm:grid-cols-5"
            value={style.cardVariant ?? 'standard'}
            onChange={value =>
              setStyle('cardVariant', value as ProductStyle['cardVariant'])
            }
            items={[
              {
                value: 'standard',
                label: <Trans message="Standard" />,
                preview: <ProductVariantPreview variant="standard" />,
              },
              {
                value: 'media',
                label: <Trans message="Media" />,
                preview: <ProductVariantPreview variant="media" />,
              },
              {
                value: 'compact',
                label: <Trans message="Compact" />,
                preview: <ProductVariantPreview variant="compact" />,
              },
              {
                value: 'poster',
                label: <Trans message="Poster" />,
                preview: <ProductVariantPreview variant="poster" />,
              },
              {
                value: 'minimal',
                label: <Trans message="Minimal" />,
                preview: <ProductVariantPreview variant="minimal" />,
              },
            ]}
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Image position" />
          </ControlLabel>
          <VisualOptionGrid
            ariaLabel={trans(message('Image position'))}
            columns="grid-cols-2"
            value={style.imagePosition ?? 'left'}
            onChange={value =>
              setStyle('imagePosition', value as ProductStyle['imagePosition'])
            }
            items={[
              {
                value: 'left',
                label: <Trans message="Left" />,
                preview: <ProductImagePositionPreview position="left" />,
              },
              {
                value: 'top',
                label: <Trans message="Top" />,
                preview: <ProductImagePositionPreview position="top" />,
              },
            ]}
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Image size" />
          </ControlLabel>
          <VisualOptionGrid
            ariaLabel={trans(message('Image size'))}
            columns="grid-cols-3"
            value={style.imageSize ?? 'medium'}
            onChange={value =>
              setStyle('imageSize', value as ProductStyle['imageSize'])
            }
            items={[
              {
                value: 'small',
                label: <Trans message="Small" />,
                preview: <span className="size-4 rounded bg-primary/45" />,
              },
              {
                value: 'medium',
                label: <Trans message="Medium" />,
                preview: <span className="size-6 rounded bg-primary/45" />,
              },
              {
                value: 'large',
                label: <Trans message="Large" />,
                preview: <span className="size-8 rounded bg-primary/45" />,
              },
            ]}
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Price position" />
          </ControlLabel>
          <VisualOptionGrid
            ariaLabel={trans(message('Price position'))}
            columns="grid-cols-3"
            value={style.pricePosition ?? 'inline'}
            onChange={value =>
              setStyle('pricePosition', value as ProductStyle['pricePosition'])
            }
            items={[
              {
                value: 'inline',
                label: <Trans message="Inline" />,
                preview: <ProductPricePositionPreview position="inline" />,
              },
              {
                value: 'right',
                label: <Trans message="Right" />,
                preview: <ProductPricePositionPreview position="right" />,
              },
              {
                value: 'below',
                label: <Trans message="Below" />,
                preview: <ProductPricePositionPreview position="below" />,
              },
            ]}
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Action style" />
          </ControlLabel>
          <VisualOptionGrid
            ariaLabel={trans(message('Action style'))}
            columns="grid-cols-3"
            value={style.actionStyle ?? 'text'}
            onChange={value =>
              setStyle('actionStyle', value as ProductStyle['actionStyle'])
            }
            items={[
              {
                value: 'text',
                label: <Trans message="Text" />,
                preview: <ProductActionPreview action="text" />,
              },
              {
                value: 'button',
                label: <Trans message="Button" />,
                preview: <ProductActionPreview action="button" />,
              },
              {
                value: 'icon',
                label: <Trans message="Icon" />,
                preview: <ProductActionPreview action="icon" />,
              },
            ]}
          />
        </div>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
          <span>
            <Trans message="Image" />
          </span>
          <Checkbox
            bindToHookForm={false}
            checked={style.showImages ?? true}
            onCheckedChange={value => setStyle('showImages', !!value)}
          />
        </label>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
          <span>
            <Trans message="Show image fallback" />
          </span>
          <Checkbox
            bindToHookForm={false}
            checked={style.showImageFallback ?? false}
            onCheckedChange={value => setStyle('showImageFallback', !!value)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <ControlLabel>
            <Trans message="Image corner radius" />
          </ControlLabel>
          <Input
            type="number"
            min={0}
            max={32}
            value={style.imageRadius ?? 8}
            onChange={event =>
              setStyle('imageRadius', Number(event.target.value))
            }
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Card border width" />
          </ControlLabel>
          <Input
            type="number"
            min={0}
            max={8}
            value={style.cardBorderWidth ?? 1}
            onChange={event =>
              setStyle('cardBorderWidth', Number(event.target.value))
            }
          />
        </div>
        <div>
          <ControlLabel>
            <Trans message="Card transparency" />
          </ControlLabel>
          <Input
            type="number"
            min={0}
            max={100}
            value={style.cardTransparency ?? 0}
            onChange={event =>
              setStyle('cardTransparency', Number(event.target.value))
            }
          />
        </div>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
          <span>
            <Trans message="Glow" />
          </span>
          <Checkbox
            bindToHookForm={false}
            checked={style.cardGlow ?? false}
            onCheckedChange={value => setStyle('cardGlow', !!value)}
          />
        </label>
      </div>
    </div>
  );
}

function ControlLabel({children}: {children: ReactNode}) {
  return (
    <div className="mb-2 text-sm leading-snug font-medium">{children}</div>
  );
}

function ProductVariantPreview({
  variant,
}: {
  variant: NonNullable<ProductStyle['cardVariant']>;
}) {
  return (
    <span
      className={cn(
        'relative flex h-12 w-16 overflow-hidden rounded border border-primary/35',
        variant === 'media' && 'flex-col',
        variant === 'compact' && 'items-center gap-1 p-1',
        variant === 'minimal' && 'border-transparent bg-transparent',
        (variant === 'standard' || variant === 'poster') && 'flex-col',
      )}
    >
      <span
        className={cn(
          'bg-primary/35',
          variant === 'compact'
            ? 'h-full w-5 shrink-0 rounded-sm'
            : 'h-6 w-full',
          variant === 'poster' && 'h-7 bg-primary/55',
          variant === 'minimal' && 'h-5 rounded-sm',
        )}
      />
      <span
        className={cn(
          'relative z-10 flex flex-1 flex-col gap-1 p-1',
          variant === 'compact' && 'p-0',
        )}
      >
        <span className="h-1.5 w-8 rounded bg-current opacity-75" />
        {variant === 'poster' ? (
          <span className="mt-auto h-1.5 w-full rounded-sm bg-primary" />
        ) : (
          <span className="h-1.5 w-5 rounded bg-current opacity-45" />
        )}
      </span>
    </span>
  );
}

function ProductImagePositionPreview({position}: {position: 'left' | 'top'}) {
  return position === 'top' ? (
    <span className="flex w-20 flex-col gap-1">
      <span className="h-6 rounded bg-primary/40" />
      <span className="h-2 rounded bg-primary/20" />
      <span className="h-2 w-2/3 rounded bg-primary/20" />
    </span>
  ) : (
    <span className="flex w-20 items-center gap-1">
      <span className="size-7 shrink-0 rounded bg-primary/40" />
      <span className="flex flex-1 flex-col gap-1">
        <span className="h-2 rounded bg-primary/25" />
        <span className="h-2 rounded bg-primary/15" />
      </span>
    </span>
  );
}

function ProductPricePositionPreview({
  position,
}: {
  position: 'inline' | 'right' | 'below';
}) {
  return (
    <span className="flex w-20 flex-col gap-1">
      <span className="h-2 rounded bg-primary/25" />
      <span className="flex items-center justify-between gap-1">
        {position === 'below' ? (
          <span className="h-2 w-1/2 rounded bg-primary/35" />
        ) : (
          <span className="h-2 w-1/2 rounded bg-primary/20" />
        )}
        {position !== 'below' ? (
          <span className="h-2 w-1/3 rounded bg-primary/45" />
        ) : null}
      </span>
    </span>
  );
}

function ProductActionPreview({action}: {action: 'text' | 'button' | 'icon'}) {
  return action === 'icon' ? (
    <span className="grid size-7 place-items-center rounded bg-primary text-primary-foreground">
      <span className="size-2 rounded-full bg-current" />
    </span>
  ) : action === 'button' ? (
    <span className="rounded-card-sm bg-primary px-3 py-1 text-[10px] text-primary-foreground">
      <Trans message="View" />
    </span>
  ) : (
    <span className="text-xs font-medium text-primary underline">
      <Trans message="View" />
    </span>
  );
}

type EmbedMetadata = GetBiolinkEmbedMetadata200;

function WidgetItemEditorDialog({
  open,
  onOpenChange,
  item,
  type,
  usesMedia,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemFormValue;
  type: NewWidgetType;
  usesMedia: boolean;
  onSubmit: (item: ItemFormValue) => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<ItemFormValue>({
    defaultValues: item,
  });
  const imageValue = useWatch({
    control: form.control,
    name: 'image',
  });
  const isFaq = type === 'faq';
  const isOffer = offerWidgetTypes.includes(type);
  const isPoll = type === 'poll';
  const isStats = type === 'stats';
  const isReviews = type === 'reviews';
  const isEmbed = type === 'embedCollection';
  const canImportMetadata =
    usesMedia && !['imageGallery', 'reviews'].includes(type);
  const [metadataImportState, setMetadataImportState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const activeMetadataRequestRef = useRef('');
  const lastAutoImportedUrlRef = useRef('');
  const needsUrl = ![
    'faq',
    'imageGallery',
    'poll',
    'stats',
    'reviews',
  ].includes(type);

  useEffect(() => {
    if (open) {
      form.reset(item);
      setMetadataImportState('idle');
      activeMetadataRequestRef.current = '';
      lastAutoImportedUrlRef.current = '';
    }
  }, [form, item, open]);

  const loadExternalMetadata = async (overwrite: boolean) => {
    const rawUrl = form.getValues('url')?.trim();
    if (!urlIsValid(rawUrl, {checkForDomain: true})) {
      form.setError('url', {
        type: 'validate',
        message: 'Enter a valid public URL.',
      });
      return;
    }

    const url = rawUrl!.match(/^[a-zA-Z]+:\/\//)
      ? rawUrl!
      : `https://${rawUrl}`;

    if (
      activeMetadataRequestRef.current === url ||
      (!overwrite && lastAutoImportedUrlRef.current === url)
    ) {
      return;
    }

    form.clearErrors('url');
    form.setValue('url', url, {shouldDirty: true, shouldValidate: true});
    activeMetadataRequestRef.current = url;
    setMetadataImportState('loading');

    try {
      if (isOffer) {
        const preview = await previewBiolinkProductImport(Number(biolinkId), {
          url,
        });
        const imported = preview.product;
        const currentPayload = form.getValues('payload') ?? {};
        const currentPriceValue = form.getValues('price');
        const currentCurrencyValue = form.getValues('currency');
        const currentMerchandising =
          currentPayload.merchandising &&
          typeof currentPayload.merchandising === 'object'
            ? (currentPayload.merchandising as Record<string, unknown>)
            : {};
        const shouldReplace = (value: unknown) =>
          overwrite || value === null || value === undefined || value === '';

        if (imported.name && shouldReplace(form.getValues('title'))) {
          form.setValue('title', imported.name, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        if (
          imported.description &&
          shouldReplace(form.getValues('description'))
        ) {
          form.setValue('description', imported.description, {
            shouldDirty: true,
          });
        }
        if (imported.image && shouldReplace(form.getValues('image'))) {
          form.setValue('image', imported.image, {shouldDirty: true});
        }
        if (imported.price !== null && shouldReplace(currentPriceValue)) {
          form.setValue('price', imported.price, {shouldDirty: true});
        }
        if (
          imported.currency &&
          (shouldReplace(currentCurrencyValue) ||
            (!overwrite && shouldReplace(currentPriceValue)))
        ) {
          form.setValue('currency', imported.currency, {shouldDirty: true});
        }

        const nextMerchandising = {...currentMerchandising};
        if (
          imported.compare_price !== null &&
          shouldReplace(currentMerchandising.comparePrice)
        ) {
          nextMerchandising.comparePrice = imported.compare_price;
        }
        if (
          imported.rating !== null &&
          shouldReplace(currentMerchandising.rating)
        ) {
          nextMerchandising.rating = imported.rating;
        }
        if (
          imported.stock_label &&
          shouldReplace(currentMerchandising.stockLabel)
        ) {
          nextMerchandising.stockLabel = imported.stock_label;
        }

        form.setValue(
          'payload',
          {
            ...currentPayload,
            provider: preview.provider,
            domain: preview.domain,
            merchandising: nextMerchandising,
          },
          {shouldDirty: true},
        );
        form.setValue('url', imported.url || url, {
          shouldDirty: true,
          shouldValidate: true,
        });
        lastAutoImportedUrlRef.current = imported.url || url;
        setMetadataImportState('success');
        return;
      }

      const metadata = await getBiolinkEmbedMetadata({url});

      if (metadata.name && (overwrite || !form.getValues('title')?.trim())) {
        form.setValue('title', metadata.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (
        metadata.description &&
        (overwrite || !form.getValues('description')?.trim())
      ) {
        form.setValue('description', metadata.description, {
          shouldDirty: true,
        });
      }
      if (metadata.image && (overwrite || !form.getValues('image')?.trim())) {
        form.setValue('image', metadata.image, {shouldDirty: true});
      }
      form.setValue(
        'payload',
        {
          ...(form.getValues('payload') ?? {}),
          provider: metadata.provider,
          domain: metadata.domain,
        },
        {shouldDirty: true},
      );
      form.setValue('url', metadata.url || url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      lastAutoImportedUrlRef.current = metadata.url || url;
      setMetadataImportState('success');
    } catch {
      setMetadataImportState('error');
    } finally {
      activeMetadataRequestRef.current = '';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <HookForm.Root
          form={form}
          onSubmit={values => {
            onSubmit({
              ...values,
              type: values.type ?? defaultItemType(type),
              active: values.active ?? true,
            });
            form.reset(emptyItem());
          }}
        >
          <Dialog.Content className="sm:max-w-3xl">
            <Dialog.Header>
              <Dialog.Title>
                <PlusIcon />
                <Trans message="Item details" />
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {usesMedia ? (
                  <ImageSelector.Square
                    className="size-32 shrink-0"
                    cropDimensions={
                      type === 'imageGallery'
                        ? {width: 800, height: 600}
                        : {width: 600, height: 600}
                    }
                    placeholderVariant="icon"
                    uploadType={UploadType.linkImages}
                    value={imageValue ?? ''}
                    onChange={value =>
                      form.setValue('image', value, {shouldDirty: true})
                    }
                  />
                ) : null}
                <Field.Group className="flex-1">
                  {canImportMetadata ? (
                    <HookForm.Field name="url">
                      <Field.Label>
                        {isEmbed ? (
                          <Trans message="Instagram, TikTok or website URL" />
                        ) : (
                          <Trans message="URL" />
                        )}
                      </Field.Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          required
                          type="url"
                          autoFocus
                          className="flex-1"
                          placeholder="https://..."
                          onBlur={event => {
                            const nextTarget = event.relatedTarget;
                            if (
                              nextTarget instanceof HTMLElement &&
                              nextTarget.closest(
                                '[data-metadata-import-button]',
                              )
                            ) {
                              return;
                            }
                            void loadExternalMetadata(false);
                          }}
                        />
                        <Button
                          data-metadata-import-button
                          type="button"
                          variant="outline"
                          className="min-h-11 shrink-0"
                          disabled={metadataImportState === 'loading'}
                          onClick={() => void loadExternalMetadata(true)}
                        >
                          {metadataImportState === 'loading' ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <SearchIcon />
                          )}
                          <Trans message="Load preview" />
                        </Button>
                      </div>
                      <Field.Description>
                        {metadataImportState === 'success' ? (
                          <Trans message="Preview loaded. You can edit every field before saving." />
                        ) : metadataImportState === 'error' ? (
                          <Trans message="The preview could not be loaded. Add the title and image manually." />
                        ) : (
                          <Trans message="Only safe metadata is imported. Provider scripts and iframes are not copied." />
                        )}
                      </Field.Description>
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  <HookForm.Field name="title">
                    <Field.Label>
                      {isFaq ? (
                        <Trans message="Question" />
                      ) : isPoll ? (
                        <Trans message="Option" />
                      ) : isStats ? (
                        <Trans message="Label" />
                      ) : isReviews ? (
                        <Trans message="Reviewer" />
                      ) : (
                        <Trans message="Title" />
                      )}
                    </Field.Label>
                    <Input required autoFocus={!canImportMetadata} />
                    <Field.Error />
                  </HookForm.Field>
                  <HookForm.Field name="description">
                    <Field.Label>
                      {isFaq ? (
                        <Trans message="Answer" />
                      ) : isStats ? (
                        <Trans message="Value" />
                      ) : isReviews ? (
                        <Trans message="Review" />
                      ) : (
                        <Trans message="Description" />
                      )}
                    </Field.Label>
                    <Textarea rows={isFaq || isReviews ? 4 : 2} />
                    <Field.Error />
                  </HookForm.Field>
                  {!isFaq &&
                  !isPoll &&
                  !isStats &&
                  !isReviews &&
                  !canImportMetadata ? (
                    <HookForm.Field name="url">
                      <Field.Label>
                        <Trans message="URL" />
                      </Field.Label>
                      <Input required={needsUrl} type="url" />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  {isOffer ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <HookForm.Field name="price">
                          <Field.Label>
                            <Trans message="Price (optional)" />
                          </Field.Label>
                          <Input type="number" min="0" step="0.01" />
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field name="currency">
                          <Field.Label>
                            <Trans message="Currency" />
                          </Field.Label>
                          <Select.Root
                            items={currencies.map(currency => ({
                              value: currency,
                              label: currency,
                            }))}
                          >
                            <Select.Trigger className="w-full">
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              {currencies.map(currency => (
                                <Select.Item key={currency} value={currency}>
                                  {currency}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Root>
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field
                          name={'payload.merchandising.comparePrice' as never}
                        >
                          <Field.Label>
                            <Trans message="Previous price (optional)" />
                          </Field.Label>
                          <Input type="number" min="0" step="0.01" />
                          <Field.Description>
                            <Trans message="Shown only when it is greater than the current price." />
                          </Field.Description>
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field
                          name={'payload.merchandising.rating' as never}
                        >
                          <Field.Label>
                            <Trans message="Rating (optional)" />
                          </Field.Label>
                          <Input type="number" min="0" max="5" step="0.1" />
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field
                          name={'payload.merchandising.badge' as never}
                        >
                          <Field.Label>
                            <Trans message="Badge (optional)" />
                          </Field.Label>
                          <Input maxLength={40} />
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field
                          name={'payload.merchandising.stockLabel' as never}
                        >
                          <Field.Label>
                            <Trans message="Availability (optional)" />
                          </Field.Label>
                          <Input maxLength={80} />
                          <Field.Error />
                        </HookForm.Field>
                      </div>
                    </>
                  ) : null}
                </Field.Group>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancel" />
              </Dialog.CloseButton>
              <Button type="submit">
                <Trans message="Done" />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </HookForm.Root>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RemoveItemDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Title>
              <Trans message="Remove item" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="Are you sure you want to remove this item from the widget?" />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>
              <Trans message="Cancel" />
            </AlertDialog.Cancel>
            <AlertDialog.Action color="danger" onClick={onConfirm}>
              <Trans message="Remove" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function SimpleConfigWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  type,
  mode = 'content',
  initialConfig,
}: DialogProps & {type: (typeof simpleWidgetTypes)[number]}) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <SimpleConfigWidgetDialogContent
          type={type}
          widget={widget}
          mode={mode}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SimpleConfigWidgetDialogContent({
  widget,
  type,
  mode,
  initialConfig,
  onClose,
}: {
  widget?: ConfigurableWidget;
  type: (typeof simpleWidgetTypes)[number];
  mode: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {trans} = useTrans();
  const copy = widgetCopy[type];
  const form = useForm<SimpleConfigWidgetFormValue>({
    defaultValues: {
      ...(initialConfig as WidgetConfig | undefined),
      title:
        widget?.config?.title ||
        (initialConfig?.title as string | undefined) ||
        trans(copy.defaultTitle),
      description:
        widget?.config?.description ??
        (initialConfig?.description as string | undefined) ??
        '',
      value: widget?.config?.value ?? '',
      label:
        widget?.config?.label ??
        (initialConfig?.label as string | undefined) ??
        '',
      address: widget?.config?.address ?? '',
      url: widget?.config?.url ?? '',
      name: widget?.config?.name ?? '',
      occupation: widget?.config?.occupation ?? '',
      email: widget?.config?.email ?? '',
      phone: widget?.config?.phone ?? '',
      whatsapp: widget?.config?.whatsapp ?? '',
      hours: widget?.config?.hours ?? '',
      discordSource: widget?.config?.discordSource ?? 'manual',
      discordUserId: widget?.config?.discordUserId ?? '',
      discordUsername: widget?.config?.discordUsername ?? '',
      discordStatus: widget?.config?.discordStatus ?? 'online',
      discordActivity: widget?.config?.discordActivity ?? '',
      discordUrl: widget?.config?.discordUrl ?? '',
      gamingSource: widget?.config?.gamingSource ?? 'manual',
      steamProfileUrl: widget?.config?.steamProfileUrl ?? '',
      gamerTag: widget?.config?.gamerTag ?? '',
      currentGame: widget?.config?.currentGame ?? '',
      platform: widget?.config?.platform ?? '',
      rank: widget?.config?.rank ?? '',
      gamingUrl: widget?.config?.gamingUrl ?? '',
      code: widget?.config?.code ?? '',
      expiresAt: widget?.config?.expiresAt ?? '',
      embedMode: widget?.config?.embedMode ?? 'link',
      presentation:
        widget?.config?.presentation ??
        (initialConfig?.presentation as WidgetConfig['presentation']) ??
        (type === 'contactCard'
          ? 'action'
          : type === 'genericVideo'
            ? 'embed'
            : undefined),
      coverImage: widget?.config?.coverImage ?? '',
      duration: widget?.config?.duration ?? '',
      metadataLabel: widget?.config?.metadataLabel ?? '',
      playBehavior: widget?.config?.playBehavior ?? 'external',
      playButtonMotion: widget?.config?.playButtonMotion ?? 'none',
      section: widget?.config?.section,
      blueprintKey: widget?.config?.blueprintKey,
      qrDisplay: widget?.config?.qrDisplay ?? 'card',
      mapDisplay: widget?.config?.mapDisplay ?? 'button',
      mapProvider:
        widget?.config?.mapProvider ??
        (widget ? (widget.config?.url ? 'custom' : 'google') : 'openstreetmap'),
      cep: widget?.config?.cep ?? '',
      street: widget?.config?.street ?? '',
      number: widget?.config?.number ?? '',
      complement: widget?.config?.complement ?? '',
      neighborhood: widget?.config?.neighborhood ?? '',
      city: widget?.config?.city ?? '',
      state: widget?.config?.state ?? '',
      latitude: widget?.config?.latitude ?? '',
      longitude: widget?.config?.longitude ?? '',
      buttonLabel:
        widget?.config?.buttonLabel ||
        (initialConfig?.buttonLabel as string | undefined) ||
        (copy.defaultButton ? trans(copy.defaultButton) : ''),
      documentKind:
        widget?.config?.documentKind ??
        (initialConfig?.documentKind as WidgetConfig['documentKind']) ??
        'file',
      enableVcard:
        widget?.config?.enableVcard ??
        (initialConfig?.enableVcard as boolean | undefined) ??
        false,
      ...widgetAdvancedDefaultValues(widget),
    },
  });
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);

  return (
    <FileUploadProvider>
      <HookForm.Root
        form={form}
        onSubmit={values => {
          crupdateWidget.mutate(
            {
              ...widgetAdvancedPayload(values),
              config: stripWidgetCopyDefaults(
                normalizeSimpleConfig(type, values),
                copy,
                trans,
              ),
              type,
            },
            {
              onSuccess: () => onClose(),
              onError: err => onFormQueryError(err, form),
            },
          );
        }}
      >
        <Dialog.Content className="sm:max-w-3xl">
          <Dialog.Header>
            <Dialog.Title>
              <WidgetDialogIcon mode={mode} fallback={copy.icon} />
              {widgetDialogTitle(mode, copy.title)}
            </Dialog.Title>
            <WidgetDialogDescription mode={mode} />
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              {mode === 'content' ? (
                <>
                  <HookForm.Field name="title">
                    <div className="flex min-h-8 items-center justify-between gap-3">
                      <Field.Label>
                        <Trans message="Title" />
                      </Field.Label>
                      <BiolinkAiSuggestionButton
                        biolinkId={biolinkId}
                        purpose={type === 'externalForm' ? 'cta' : 'title'}
                        value={form.watch('title')}
                        onApply={suggestion =>
                          form.setValue('title', suggestion, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>
                    <Input required autoFocus />
                    <Field.Error />
                  </HookForm.Field>
                  <SimpleWidgetFields type={type} form={form} scope="basics" />
                </>
              ) : null}
              {mode === 'presentation' ? (
                <>
                  <SimpleWidgetFields
                    type={type}
                    form={form}
                    scope="appearance"
                  />
                </>
              ) : null}
              {mode === 'advanced' ? (
                <>
                  <HookForm.Field name="description">
                    <Field.Label>
                      <Trans message="Description (optional)" />
                    </Field.Label>
                    <Textarea rows={2} />
                    <Field.Error />
                  </HookForm.Field>
                  <SimpleWidgetFields
                    type={type}
                    form={form}
                    scope="advanced"
                  />
                  <BiolinkSectionFields />
                </>
              ) : null}
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
            <WidgetFormActionButtons form={form} widget={widget} />
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="submit"
              disabled={
                crupdateWidget.isPending ||
                (!!widget && !form.formState.isDirty)
              }
            >
              {widget ? <Trans message="Update" /> : <Trans message="Add" />}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
    </FileUploadProvider>
  );
}

function SimpleWidgetFields({
  type,
  form,
  scope,
}: {
  type: (typeof simpleWidgetTypes)[number];
  form: UseFormReturn<SimpleConfigWidgetFormValue>;
  scope: 'basics' | 'appearance' | 'advanced';
}) {
  const {trans} = useTrans();

  const hasFocusedPresentation = [
    'qrCode',
    'location',
    'contactCard',
    'genericVideo',
    'externalForm',
  ].includes(type);

  if (scope !== 'basics' && !hasFocusedPresentation) {
    return null;
  }

  if (type === 'discordPresence') {
    return (
      <>
        <HookForm.Field name="discordSource">
          <Field.Label>
            <Trans message="Profile source" />
          </Field.Label>
          <Select.Root
            items={[
              {value: 'manual', label: <Trans message="Manual" />},
              {
                value: 'lanyard',
                label: <Trans message="Lanyard live profile" />,
              },
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="manual">
                <Trans message="Manual" />
              </Select.Item>
              <Select.Item value="lanyard">
                <Trans message="Lanyard live profile" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="discordUserId">
          <Field.Label>
            <Trans message="Discord user ID" />
          </Field.Label>
          <Input inputMode="numeric" placeholder="123456789012345678" />
          <Field.Error />
        </HookForm.Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="discordUsername">
            <Field.Label>
              <Trans message="Discord username" />
            </Field.Label>
            <Input required placeholder="playername" />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="discordStatus">
            <Field.Label>
              <Trans message="Presence status" />
            </Field.Label>
            <Select.Root
              items={[
                {value: 'online', label: <Trans message="Online" />},
                {value: 'idle', label: <Trans message="Idle" />},
                {value: 'dnd', label: <Trans message="Do not disturb" />},
                {value: 'offline', label: <Trans message="Offline" />},
              ]}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="online">
                  <Trans message="Online" />
                </Select.Item>
                <Select.Item value="idle">
                  <Trans message="Idle" />
                </Select.Item>
                <Select.Item value="dnd">
                  <Trans message="Do not disturb" />
                </Select.Item>
                <Select.Item value="offline">
                  <Trans message="Offline" />
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>
        </div>
        <HookForm.Field name="discordActivity">
          <Field.Label>
            <Trans message="Activity (optional)" />
          </Field.Label>
          <Input placeholder={trans(message('Playing with the community'))} />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="discordUrl">
          <Field.Label>
            <Trans message="Discord invite URL (optional)" />
          </Field.Label>
          <Input type="url" placeholder="https://discord.gg/example" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="buttonLabel">
          <Field.Label>
            <Trans message="Button label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'gamingProfile') {
    return (
      <>
        <HookForm.Field name="gamingSource">
          <Field.Label>
            <Trans message="Profile source" />
          </Field.Label>
          <Select.Root
            items={[
              {value: 'manual', label: <Trans message="Manual" />},
              {value: 'steam', label: <Trans message="Steam Community" />},
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="manual">
                <Trans message="Manual" />
              </Select.Item>
              <Select.Item value="steam">
                <Trans message="Steam Community" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="steamProfileUrl">
          <Field.Label>
            <Trans message="Steam profile URL" />
          </Field.Label>
          <Input
            type="url"
            placeholder="https://steamcommunity.com/id/player"
          />
          <Field.Error />
        </HookForm.Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="gamerTag">
            <Field.Label>
              <Trans message="Gamertag" />
            </Field.Label>
            <Input required placeholder="AndradeRole" />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="currentGame">
            <Field.Label>
              <Trans message="Current game (optional)" />
            </Field.Label>
            <Input placeholder="Forza Horizon 5" />
            <Field.Error />
          </HookForm.Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="platform">
            <Field.Label>
              <Trans message="Platform (optional)" />
            </Field.Label>
            <Input placeholder={trans(message('PC, PlayStation, Xbox...'))} />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="rank">
            <Field.Label>
              <Trans message="Rank (optional)" />
            </Field.Label>
            <Input placeholder={trans(message('Diamond'))} />
            <Field.Error />
          </HookForm.Field>
        </div>
        <HookForm.Field name="gamingUrl">
          <Field.Label>
            <Trans message="Gaming profile URL (optional)" />
          </Field.Label>
          <Input
            type="url"
            placeholder="https://steamcommunity.com/id/example"
          />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="buttonLabel">
          <Field.Label>
            <Trans message="Button label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'qrCode') {
    if (scope === 'appearance') {
      return (
        <HookForm.Field name="qrDisplay">
          <Field.Label>
            <Trans message="Display mode" />
          </Field.Label>
          <Select.Root
            items={[
              {value: 'card', label: <Trans message="QR card" />},
              {value: 'code', label: <Trans message="QR code only" />},
              {value: 'button', label: <Trans message="Open from button" />},
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="card">
                <Trans message="QR card" />
              </Select.Item>
              <Select.Item value="code">
                <Trans message="QR code only" />
              </Select.Item>
              <Select.Item value="button">
                <Trans message="Open from button" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Error />
        </HookForm.Field>
      );
    }

    if (scope === 'advanced') {
      return null;
    }

    return (
      <>
        <HookForm.Field name="value">
          <Field.Label>
            <Trans message="QR code value" />
          </Field.Label>
          <Input required placeholder="https://example.com" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="label">
          <Field.Label>
            <Trans message="Label (optional)" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'contactCard') {
    if (scope === 'basics') {
      return (
        <>
          <HookForm.Field name="name">
            <Field.Label>
              <Trans message="Name" />
            </Field.Label>
            <Input />
            <Field.Error />
          </HookForm.Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <HookForm.Field name="email">
              <Field.Label>
                <Trans message="Email (optional)" />
              </Field.Label>
              <Input type="email" autoComplete="email" />
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="phone">
              <Field.Label>
                <Trans message="Phone (optional)" />
              </Field.Label>
              <Input type="tel" autoComplete="tel" />
              <Field.Error />
            </HookForm.Field>
          </div>
          <HookForm.Field name="whatsapp">
            <Field.Label>
              <Trans message="WhatsApp (optional)" />
            </Field.Label>
            <Input type="tel" inputMode="tel" />
            <Field.Description>
              <Trans message="Add at least one contact method. WhatsApp is used first for the primary action." />
            </Field.Description>
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="enableVcard">
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
              <span>
                <span className="block font-medium">
                  <Trans message="Allow vCard download" />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  <Trans message="Visitors can save these public details as a .vcf contact." />
                </span>
              </span>
              <Checkbox bindToHookForm />
            </label>
            <Field.Error />
          </HookForm.Field>
        </>
      );
    }

    if (scope === 'appearance') {
      return (
        <>
          <HookForm.Field name="presentation">
            <Field.Label>
              <Trans message="Presentation" />
            </Field.Label>
            <Select.Root
              items={[
                {value: 'action', label: <Trans message="Open from action" />},
                {value: 'inline', label: <Trans message="Inline details" />},
                {
                  value: 'business',
                  label: <Trans message="Business information" />,
                },
              ]}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="action">
                  <Trans message="Open from action" />
                </Select.Item>
                <Select.Item value="inline">
                  <Trans message="Inline details" />
                </Select.Item>
                <Select.Item value="business">
                  <Trans message="Business information" />
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <Field.Description>
              <Trans message="Action is compact, inline shows a simple card, and business uses a wider information layout." />
            </Field.Description>
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="buttonLabel">
            <Field.Label>
              <Trans message="Button label" />
            </Field.Label>
            <Input />
            <Field.Error />
          </HookForm.Field>
        </>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="occupation">
            <Field.Label>
              <Trans message="Occupation (optional)" />
            </Field.Label>
            <Input autoComplete="organization-title" />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="hours">
            <Field.Label>
              <Trans message="Hours (optional)" />
            </Field.Label>
            <Input placeholder={trans(message('Mon–Fri, 09:00–18:00'))} />
            <Field.Error />
          </HookForm.Field>
        </div>
        <HookForm.Field name="address">
          <Field.Label>
            <Trans message="Address (optional)" />
          </Field.Label>
          <Input autoComplete="street-address" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="url">
          <Field.Label>
            <Trans message="Primary contact URL (optional)" />
          </Field.Label>
          <Input type="url" placeholder="https://example.com/contact" />
          <Field.Description>
            <Trans message="Overrides the automatic WhatsApp, email or phone action when provided." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'location') {
    if (scope === 'appearance') {
      return (
        <>
          <HookForm.Field name="buttonLabel">
            <Field.Label>
              <Trans message="Button label" />
            </Field.Label>
            <Input />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="mapDisplay">
            <Field.Label>
              <Trans message="Display mode" />
            </Field.Label>
            <VisualOptionGrid
              ariaLabel={trans(message('Map display mode'))}
              columns="grid-cols-3"
              value={form.watch('mapDisplay') || 'button'}
              onChange={value =>
                form.setValue(
                  'mapDisplay',
                  value as 'button' | 'iframe' | 'modal',
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                )
              }
              items={[
                {
                  value: 'button',
                  label: <Trans message="Link Button" />,
                  preview: <MapPresentationPreview presentation="button" />,
                },
                {
                  value: 'iframe',
                  label: <Trans message="Embedded Map" />,
                  preview: <MapPresentationPreview presentation="iframe" />,
                },
                {
                  value: 'modal',
                  label: <Trans message="Modal View" />,
                  preview: <MapPresentationPreview presentation="modal" />,
                },
              ]}
            />
            <Field.Error />
          </HookForm.Field>
        </>
      );
    }

    if (scope === 'advanced') {
      return null;
    }

    return <LocationWidgetFields form={form} />;
  }

  if (type === 'discountCode') {
    return (
      <>
        <HookForm.Field name="code">
          <Field.Label>
            <Trans message="Discount code" />
          </Field.Label>
          <Input required />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="expiresAt">
          <Field.Label>
            <Trans message="Valid until (optional)" />
          </Field.Label>
          <Input type="date" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="url">
          <Field.Label>
            <Trans message="Related URL (optional)" />
          </Field.Label>
          <Input type="url" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="buttonLabel">
          <Field.Label>
            <Trans message="Button label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'genericVideo') {
    if (scope === 'basics') {
      return (
        <HookForm.Field name="url">
          <Field.Label>
            <Trans message="Video URL" />
          </Field.Label>
          <Input
            type="url"
            required
            placeholder="https://example.com/video.mp4"
          />
          <Field.Description>
            <Trans message="Use a direct video file or a supported video provider URL." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      );
    }

    if (scope === 'appearance') {
      return (
        <>
          <HookForm.Field name="presentation">
            <Field.Label>
              <Trans message="Video presentation" />
            </Field.Label>
            <Select.Root
              items={[
                {value: 'embed', label: <Trans message="Embedded player" />},
                {value: 'featured', label: <Trans message="Featured card" />},
                {value: 'link', label: <Trans message="Link only" />},
              ]}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="embed">
                  <Trans message="Embedded player" />
                </Select.Item>
                <Select.Item value="featured">
                  <Trans message="Featured card" />
                </Select.Item>
                <Select.Item value="link">
                  <Trans message="Link only" />
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>
          <Field.Root name="coverImage">
            <Field.Label>
              <Trans message="Custom cover (optional)" />
            </Field.Label>
            <ImageSelector.Input
              cropDimensions={{width: 1280, height: 720}}
              value={form.watch('coverImage') ?? ''}
              onChange={value =>
                form.setValue('coverImage', value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              uploadType={UploadType.linkImages}
            />
            <Field.Description>
              <Trans message="Upload a 16:9 image shown before playback." />
            </Field.Description>
            <Field.Error />
          </Field.Root>
          <div className="grid gap-4 sm:grid-cols-2">
            <HookForm.Field name="playBehavior">
              <Field.Label>
                <Trans message="Playback behavior" />
              </Field.Label>
              <Select.Root
                items={[
                  {
                    value: 'external',
                    label: <Trans message="Open external player" />,
                  },
                  {
                    value: 'inline',
                    label: <Trans message="Play inline after click" />,
                  },
                ]}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="external">
                    <Trans message="Open external player" />
                  </Select.Item>
                  <Select.Item value="inline">
                    <Trans message="Play inline after click" />
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="playButtonMotion">
              <Field.Label>
                <Trans message="Play button motion" />
              </Field.Label>
              <Select.Root
                items={[
                  {value: 'none', label: <Trans message="None" />},
                  {value: 'pulse', label: <Trans message="Subtle pulse" />},
                ]}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="none">
                    <Trans message="None" />
                  </Select.Item>
                  <Select.Item value="pulse">
                    <Trans message="Subtle pulse" />
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Field.Error />
            </HookForm.Field>
          </div>
        </>
      );
    }

    return (
      <>
        <HookForm.Field name="embedMode">
          <Field.Label>
            <Trans message="Provider display mode" />
          </Field.Label>
          <Select.Root
            items={[
              {value: 'link', label: <Trans message="Link card" />},
              {value: 'iframe', label: <Trans message="Embed when allowed" />},
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="link">
                <Trans message="Link card" />
              </Select.Item>
              <Select.Item value="iframe">
                <Trans message="Embed when allowed" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Description>
            <Trans message="Unsupported providers always fall back to a safe link." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="duration">
            <Field.Label>
              <Trans message="Duration (optional)" />
            </Field.Label>
            <Input placeholder="12:30" />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="metadataLabel">
            <Field.Label>
              <Trans message="Metadata label (optional)" />
            </Field.Label>
            <Input />
            <Field.Error />
          </HookForm.Field>
        </div>
        <HookForm.Field name="buttonLabel">
          <Field.Label>
            <Trans message="Button label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  if (type === 'externalForm') {
    if (scope === 'appearance') {
      return (
        <>
          <HookForm.Field name="embedMode">
            <Field.Label>
              <Trans message="Display mode" />
            </Field.Label>
            <Select.Root
              items={[
                {value: 'link', label: <Trans message="Link card" />},
                {
                  value: 'iframe',
                  label: <Trans message="Embed when allowed" />,
                },
              ]}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="link">
                  <Trans message="Link card" />
                </Select.Item>
                <Select.Item value="iframe">
                  <Trans message="Embed when allowed" />
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <Field.Description>
              <Trans message="Embeds only render for safe allowed providers; otherwise visitors see a link." />
            </Field.Description>
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="buttonLabel">
            <Field.Label>
              <Trans message="Button label" />
            </Field.Label>
            <Input />
            <Field.Error />
          </HookForm.Field>
        </>
      );
    }

    if (scope === 'advanced') {
      return null;
    }

    return (
      <HookForm.Field name="url">
        <Field.Label>
          <Trans message="Form URL" />
        </Field.Label>
        <Input type="url" required placeholder="https://example.com" />
        <Field.Error />
      </HookForm.Field>
    );
  }

  if (type === 'document') {
    const documentUrl = form.watch('url') ?? '';
    return (
      <>
        <HookForm.Field name="url">
          <Field.Label>
            <Trans message="Document URL" />
          </Field.Label>
          <Input
            type="text"
            inputMode="url"
            required
            placeholder="https://example.com/file.pdf"
          />
          <Field.Description>
            <Trans message="Paste an HTTPS URL or upload a validated document below." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
        <Field.Root name="documentUpload">
          <BiolinkFileSelector
            accept=".pdf,.docx,.xlsx,.pptx"
            uploadType={UploadType.biolinkDocuments}
            value={documentUrl}
            emptyLabel={<Trans message="Upload document" />}
            icon={<FileTextIcon className="size-4" />}
            onChange={value =>
              form.setValue('url', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Field.Root>
        <HookForm.Field name="documentKind">
          <Field.Label>
            <Trans message="Document type" />
          </Field.Label>
          <Select.Root
            items={[
              {value: 'pdf', label: <Trans message="PDF" />},
              {value: 'spreadsheet', label: <Trans message="Spreadsheet" />},
              {value: 'presentation', label: <Trans message="Presentation" />},
              {value: 'file', label: <Trans message="File" />},
            ]}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="pdf">
                <Trans message="PDF" />
              </Select.Item>
              <Select.Item value="spreadsheet">
                <Trans message="Spreadsheet" />
              </Select.Item>
              <Select.Item value="presentation">
                <Trans message="Presentation" />
              </Select.Item>
              <Select.Item value="file">
                <Trans message="File" />
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="label">
          <Field.Label>
            <Trans message="File label (optional)" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="buttonLabel">
          <Field.Label>
            <Trans message="Button label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </>
    );
  }

  return (
    <>
      <HookForm.Field name="url">
        <Field.Label>
          <Trans message="Feed URL" />
        </Field.Label>
        <Input type="url" required placeholder="https://example.com" />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="buttonLabel">
        <Field.Label>
          <Trans message="Button label" />
        </Field.Label>
        <Input />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}

export function CaptureWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const copy = widgetCopy[widget.type];

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={copy.defaultTitle}
          />
        </div>
        <div>
          {widget.type === 'emailSignup' ? (
            <Trans message="Collects email subscribers" />
          ) : widget.type === 'smsSignup' ? (
            <Trans message="Collects SMS subscribers" />
          ) : widget.type === 'eventRsvp' ? (
            <Trans message="Collects event responses" />
          ) : (
            <Trans message="Collects contact messages" />
          )}
        </div>
      </div>
    );
  }

  return <PublicCaptureForm widget={widget} appearance={appearance} />;
}

function PublicCaptureForm({
  widget,
  appearance,
}: {
  widget: ConfigurableWidget;
  appearance?: BiolinkAppearanceConfig | null;
}) {
  const {trans} = useTrans();
  const createInitialFormData = () => ({
    name: '',
    email: '',
    phone: '',
    message: '',
    response: 'going',
    guestCount: 0,
    guests: [] as string[],
    consent: false,
  });
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData);
  const copy = widgetCopy[widget.type];
  const isEmail = widget.type === 'emailSignup';
  const isSms = widget.type === 'smsSignup';
  const isRsvp = widget.type === 'eventRsvp';
  const title = translatedWidgetText(
    widget.config.title,
    copy.defaultTitle,
    trans,
  );
  const description = widget.config.description;
  const showHeading = shouldShowBiolinkSectionHeading(widget.config.section);
  const contactMode = widget.config.contactMode ?? 'email_required';
  const emailRequired =
    !isSms &&
    (isEmail ||
      contactMode === 'email_required' ||
      contactMode === 'email_and_phone');
  const phoneRequired =
    isSms ||
    contactMode === 'phone_required' ||
    contactMode === 'email_and_phone';
  const showPhone = !isEmail || isSms;
  const allowWaitlist = !!widget.config.allowWaitlist;
  const maxGuests = widget.config.allowGuests
    ? Math.min(Math.max(Number(widget.config.maxGuests ?? 0), 0), 10)
    : 0;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('loading');

    try {
      await apiClient.post(
        `public/biolink/${widget.biolink_id}/widget/${widget.id}/submission`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          consent: formData.consent,
          payload: isRsvp
            ? {
                response: formData.response,
                guest_count: formData.guestCount,
                guests: formData.guests.map(name => ({name})),
              }
            : widget.config.campaign
              ? {campaign: widget.config.campaign}
              : {},
        },
      );
      setState('success');
    } catch {
      setState('error');
    }
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setState('idle');
      setFormData(createInitialFormData());
    }
  };

  if ((isEmail || isSms) && widget.config.presentation === 'inline') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
      >
        <WidgetSectionHeader widget={widget} copy={copy} />
        {state === 'success' ? (
          <div
            className="rounded-lg bg-positive/10 p-4 text-sm text-positive"
            role="status"
          >
            {widget.config.successMessage ||
              (copy.defaultSuccess ? <Trans {...copy.defaultSuccess} /> : null)}
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={submit}>
            <div className="grid gap-3 @2xl:grid-cols-2">
              <PublicInput
                value={formData.name}
                label={<Trans message="Name (optional)" />}
                onChange={value =>
                  setFormData(previous => ({...previous, name: value}))
                }
              />
              {isEmail ? (
                <PublicInput
                  required
                  type="email"
                  value={formData.email}
                  label={<Trans message="Email" />}
                  onChange={value =>
                    setFormData(previous => ({...previous, email: value}))
                  }
                />
              ) : (
                <PublicInput
                  required
                  value={formData.phone}
                  label={<Trans message="Phone" />}
                  onChange={value =>
                    setFormData(previous => ({...previous, phone: value}))
                  }
                />
              )}
            </div>
            <label className="flex items-start gap-2 text-xs leading-5 opacity-75">
              <Checkbox
                bindToHookForm={false}
                checked={formData.consent}
                onCheckedChange={checked =>
                  setFormData(previous => ({
                    ...previous,
                    consent: !!checked,
                  }))
                }
                required
              />
              <span>
                {widget.config.consentText || (
                  <Trans message="I agree to share this information with the page owner." />
                )}
              </span>
            </label>
            {state === 'error' ? (
              <p className="text-sm text-destructive" role="alert">
                <Trans message="Could not submit this form. Please check the fields and try again." />
              </p>
            ) : null}
            <PublicSubmitButton
              appearance={appearance}
              disabled={state === 'loading'}
              label={
                widget.config.buttonLabel ||
                (copy.defaultButton ? <Trans {...copy.defaultButton} /> : null)
              }
            />
            <PublicFormLegalNotice />
          </form>
        )}
      </BiolinkWidgetSurface>
    );
  }

  return (
    <>
      <PublicActionButton
        appearance={appearance}
        icon={copy.icon}
        title={showHeading ? title : null}
        description={showHeading ? description : null}
        onClick={() => setOpen(true)}
      />

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="bg-black/75" />
          <Dialog.Content className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-background p-0 text-foreground shadow-2xl @2xl:max-w-md">
            <Dialog.Header className="border-b px-6 py-5 pe-14 text-center">
              <Dialog.Title className="justify-center text-base">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-center">
                  {description}
                </Dialog.Description>
              ) : null}
            </Dialog.Header>
            {state === 'success' ? (
              <div className="space-y-5 px-6 py-6 text-center">
                <div className="rounded-lg bg-positive/10 p-4 text-sm text-positive">
                  {widget.config.successMessage ||
                    (copy.defaultSuccess ? (
                      <Trans {...copy.defaultSuccess} />
                    ) : null)}
                </div>
                <Dialog.CloseButton className="w-full" color="primary">
                  <Trans message="Done" />
                </Dialog.CloseButton>
              </div>
            ) : (
              <form onSubmit={submit}>
                <Dialog.Body className="mx-0 max-h-[min(64vh,520px)] space-y-3 px-6 py-5">
                  {!isEmail && !isSms ? (
                    <PublicInput
                      required
                      value={formData.name}
                      label={<Trans message="Name" />}
                      onChange={value =>
                        setFormData(prev => ({...prev, name: value}))
                      }
                    />
                  ) : (
                    <PublicInput
                      value={formData.name}
                      label={<Trans message="Name (optional)" />}
                      onChange={value =>
                        setFormData(prev => ({...prev, name: value}))
                      }
                    />
                  )}
                  {!isSms ? (
                    <PublicInput
                      required={emailRequired}
                      type="email"
                      value={formData.email}
                      label={
                        emailRequired ? (
                          <Trans message="Email" />
                        ) : (
                          <Trans message="Email (optional)" />
                        )
                      }
                      onChange={value =>
                        setFormData(prev => ({...prev, email: value}))
                      }
                    />
                  ) : null}
                  {showPhone ? (
                    <PublicInput
                      required={phoneRequired}
                      value={formData.phone}
                      label={
                        phoneRequired ? (
                          <Trans message="Phone" />
                        ) : (
                          <Trans message="Phone (optional)" />
                        )
                      }
                      onChange={value =>
                        setFormData(prev => ({...prev, phone: value}))
                      }
                    />
                  ) : null}
                  {isRsvp ? (
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">
                        <Trans message="Response" />
                      </span>
                      <select
                        className="h-10 w-full rounded-input border border-input bg-background px-3 text-foreground"
                        value={formData.response}
                        onChange={event =>
                          setFormData(prev => ({
                            ...prev,
                            response: event.target.value,
                          }))
                        }
                      >
                        <option value="going">
                          <Trans message="Going" />
                        </option>
                        <option value="maybe">
                          <Trans message="Maybe" />
                        </option>
                        {allowWaitlist ? (
                          <option value="waitlist">
                            <Trans message="Waitlist" />
                          </option>
                        ) : null}
                        <option value="interested">
                          <Trans message="Interested" />
                        </option>
                      </select>
                    </label>
                  ) : null}
                  {isRsvp && maxGuests > 0 ? (
                    <div className="space-y-2">
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                          <Trans message="Companions" />
                        </span>
                        <select
                          className="h-10 w-full rounded-input border border-input bg-background px-3 text-foreground"
                          value={formData.guestCount}
                          onChange={event => {
                            const guestCount = Number(event.target.value);
                            setFormData(prev => ({
                              ...prev,
                              guestCount,
                              guests: Array.from(
                                {length: guestCount},
                                (_, index) => prev.guests[index] ?? '',
                              ),
                            }));
                          }}
                        >
                          {Array.from({length: maxGuests + 1}, (_, index) => (
                            <option key={index} value={index}>
                              {index}
                            </option>
                          ))}
                        </select>
                      </label>
                      {formData.guests.map((guest, index) => (
                        <PublicInput
                          key={index}
                          required
                          value={guest}
                          label={
                            <>
                              <Trans message="Companion" /> {index + 1}
                            </>
                          }
                          onChange={value =>
                            setFormData(prev => ({
                              ...prev,
                              guests: prev.guests.map((name, guestIndex) =>
                                guestIndex === index ? value : name,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {contactMode === 'email_or_phone' ? (
                    <div className="text-xs text-muted-foreground">
                      <Trans message="Provide at least one contact method: email or phone." />
                    </div>
                  ) : null}
                  {!isEmail && !isSms ? (
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">
                        <Trans message="Message" />
                      </span>
                      <textarea
                        required={widget.type === 'contactForm'}
                        className="min-h-24 w-full rounded-xl border border-current/20 bg-background/50 px-3.5 py-2.5 text-foreground shadow-sm backdrop-blur-sm transition-all outline-none focus:border-current/40 focus:ring-2 focus:ring-current/10"
                        value={formData.message}
                        onChange={event =>
                          setFormData(prev => ({
                            ...prev,
                            message: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ) : null}
                  <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <Checkbox
                      bindToHookForm={false}
                      checked={formData.consent}
                      onCheckedChange={checked =>
                        setFormData(prev => ({...prev, consent: !!checked}))
                      }
                      required
                    />
                    <span>
                      {widget.config.consentText ? (
                        widget.config.consentText
                      ) : (
                        <Trans message="I agree to share this information with the page owner." />
                      )}
                    </span>
                  </label>
                  <PublicFormLegalNotice />
                  {state === 'error' ? (
                    <div className="text-sm text-destructive">
                      <Trans message="Could not submit this form. Please check the fields and try again." />
                    </div>
                  ) : null}
                </Dialog.Body>
                <div className="border-t border-current/10 bg-muted/40 px-6 py-4">
                  <PublicSubmitButton
                    appearance={appearance}
                    disabled={state === 'loading'}
                    label={
                      widget.config.buttonLabel ||
                      (copy.defaultButton ? (
                        <Trans {...copy.defaultButton} />
                      ) : null)
                    }
                  />
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function PublicFormLegalNotice() {
  return (
    <p className="text-center text-xs leading-5 text-balance text-muted-foreground">
      <Trans message="Protected by site security checks when enabled. By submitting, you agree to this site's" />{' '}
      <a
        href="/pages/terms-of-service"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        <Trans message="terms" />
      </a>{' '}
      <Trans message="and" />{' '}
      <a
        href="/pages/privacy-policy"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        <Trans message="privacy policy" />
      </a>
      .
    </p>
  );
}

function PublicInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        required={required}
        type={type}
        className="h-11 w-full rounded-xl border border-current/20 bg-background/50 px-3.5 text-foreground shadow-sm backdrop-blur-sm transition-all outline-none focus:border-current/40 focus:ring-2 focus:ring-current/10"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

function PublicSubmitButton({
  appearance,
  label,
  disabled,
  type = 'submit',
  onClick,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  label: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  const btnConfig = appearance?.btnConfig;
  const variant = btnConfig?.variant ?? 'solid';
  const isOutline = outlineButtonVariants.has(String(variant));
  const hasTextColor = !!btnConfig?.textColor;
  const hasBackgroundColor = !!btnConfig?.color;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'biolink-btn-custom biolink-public-action flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden border px-4 py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:pointer-events-none disabled:transform-none disabled:opacity-50',
        btnConfig?.radius ?? 'rounded-sm',
        !hasBackgroundColor &&
          (isOutline ? 'border-primary' : 'border-primary bg-primary'),
        !hasTextColor &&
          (isOutline ? 'text-primary' : 'text-primary-foreground'),
      )}
      style={getBiolinkButtonStyle({btnConfig})}
    >
      {label}
    </button>
  );
}

export function OfferWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const [pixCopied, copyPix] = useClipboard(widget.config.pixPayload ?? '', {
    successDuration: 1800,
  });
  const items =
    widget.config.source === 'catalog' && widget.type === 'linkedProduct'
      ? (widget.catalog_items ?? []).map(
          (item, index) =>
            ({
              id: Number(item.id),
              biolink_id: Number(item.biolink_id),
              biolink_widget_id: Number(widget.id),
              type: 'product',
              active:
                String(item.active) !== 'false' && String(item.active) !== '0',
              sort_order: index,
              title: item.name,
              description: item.description ?? null,
              url: item.url ?? null,
              image: item.image ?? null,
              price:
                item.price === null || item.price === undefined
                  ? null
                  : String(item.price),
              currency: item.currency ?? null,
              payload: {
                merchandising: {
                  comparePrice:
                    item.compare_price === null ||
                    item.compare_price === undefined
                      ? null
                      : Number(item.compare_price),
                  badge: item.badge ?? null,
                  rating:
                    item.rating === null || item.rating === undefined
                      ? null
                      : Number(item.rating),
                  stockLabel: item.stock_label ?? null,
                },
              },
            }) satisfies BiolinkWidgetItem,
        )
      : (widget.items ?? []);
  const copy = widgetCopy[widget.type];

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={copy.defaultTitle}
          />
        </div>
        <div>
          {items.length} <Trans message="items" />
        </div>
      </div>
    );
  }

  const layoutInfo = collectionLayoutClasses(
    widget.type === 'linkedProduct' &&
      normalizeCollectionLayout(widget.config.layout) === 'line'
      ? 'grid'
      : (widget.config.layout ?? 'grid'),
  );
  const itemsClassName =
    layoutInfo.layout === 'grid'
      ? 'grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4'
      : undefined;
  const boxTextColor = widget.config.boxTextColor || undefined;
  const boxTone = getOfferBoxTextTone(boxTextColor);
  const globalCard = appearance?.cardConfig;
  const resolvedProductStyle: ProductStyle = {
    ...defaultOfferProductStyle(widget.type),
    ...(globalCard
      ? {
          ...globalCard,
          cardTransparency: globalCard.transparency,
          cardBorderWidth: globalCard.borderWidth,
        }
      : {}),
    ...widget.config.productStyle,
  };
  const isOfferCarousel = layoutInfo.layout === 'slide';
  const renderOfferCard = (item: BiolinkWidgetItem) => (
    <OfferCard
      key={item.id}
      item={item}
      buttonLabel={translatedWidgetText(
        widget.config.buttonLabel,
        copy.defaultButton,
        trans,
      )}
      offerType={widget.type}
      layout={layoutInfo.layout}
      utm={widget.utm}
      mutedColor={boxTone.mutedColor}
      linkColor={boxTone.linkColor}
      productStyle={resolvedProductStyle}
      itemStyle={resolveCollectionItemStyle(
        appearance,
        widget.config.itemStyle,
      )}
      buttonConfig={appearance?.btnConfig}
      actionIcon={offerActionIcon(widget.type)}
    />
  );

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="overflow-hidden !border-0 !bg-transparent !p-0"
      style={{borderWidth: 0, background: 'transparent'}}
    >
      <div className="p-4 @2xl:p-5">
        <WidgetSectionHeader
          widget={widget}
          copy={copy}
          mutedColor={boxTone.mutedColor}
        />
      </div>
      {widget.type === 'donation' && widget.config.pixPayload ? (
        <div className="mx-4 mb-4 rounded-card-sm border bg-background/70 p-4 text-center @2xl:mx-5">
          <QrCodeRenderer
            url={widget.config.pixPayload}
            size={180}
            className="mx-auto w-fit overflow-hidden rounded-lg bg-white p-2"
          />
          <div className="mt-3 font-semibold">
            <Trans message="Pay with Pix" />
          </div>
          {widget.config.pixAmount ? (
            <div className="mt-1 text-sm opacity-75">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(widget.config.pixAmount))}
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={copyPix}
          >
            <CopyIcon />
            {pixCopied ? (
              <Trans message="Pix code copied" />
            ) : (
              <Trans message="Copy Pix code" />
            )}
          </Button>
          <p className="mt-2 text-xs opacity-65">
            <Trans message="Payment is completed directly in the visitor's bank. MeuLinkBio does not process funds." />
          </p>
        </div>
      ) : null}
      {isOfferCarousel ? (
        <OfferSlideCarousel items={items} renderItem={renderOfferCard} />
      ) : (
        <div className="px-4 pb-4 @2xl:px-5 @2xl:pb-5">
          <CollectionItems
            layout={layoutInfo.layout}
            className={itemsClassName}
          >
            {items.map(renderOfferCard)}
          </CollectionItems>
        </div>
      )}
    </BiolinkWidgetSurface>
  );
}

function OfferSlideCarousel({
  items,
  renderItem,
}: {
  items: BiolinkWidgetItem[];
  renderItem: (item: BiolinkWidgetItem) => ReactElement;
}) {
  return (
    <div className="px-4 pb-4 @2xl:px-5 @2xl:pb-5">
      <CollectionCarousel>{items.map(renderItem)}</CollectionCarousel>
    </div>
  );
}

function offerActionIcon(type: NewWidgetType): ReactNode {
  switch (type) {
    case 'linkedCourse':
      return <GraduationCapIcon className="size-4" />;
    case 'service':
      return <UserRoundCheckIcon className="size-4" />;
    case 'donation':
      return <HandHeartIcon className="size-4" />;
    default:
      return <ShoppingCartIcon className="size-4" />;
  }
}

type MerchandisingDetails = {
  comparePrice: number | null;
  badge: string | null;
  rating: number | null;
  stockLabel: string | null;
};

function readMerchandising(payload: unknown): MerchandisingDetails {
  const payloadRecord =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};
  const value =
    payloadRecord.merchandising &&
    typeof payloadRecord.merchandising === 'object'
      ? (payloadRecord.merchandising as Record<string, unknown>)
      : {};
  const comparePrice = Number(value.comparePrice);
  const rating = Number(value.rating);

  return {
    comparePrice:
      value.comparePrice !== null &&
      value.comparePrice !== undefined &&
      Number.isFinite(comparePrice)
        ? comparePrice
        : null,
    badge:
      typeof value.badge === 'string' && value.badge.trim()
        ? value.badge.trim()
        : null,
    rating:
      value.rating !== null &&
      value.rating !== undefined &&
      Number.isFinite(rating)
        ? Math.max(0, Math.min(5, rating))
        : null,
    stockLabel:
      typeof value.stockLabel === 'string' && value.stockLabel.trim()
        ? value.stockLabel.trim()
        : null,
  };
}

function RatingLabel({rating}: {rating: number}) {
  return (
    <span
      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold"
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

function productActionButtonStyle(
  buttonConfig?: BiolinkAppearanceConfig['btnConfig'],
): CSSProperties {
  if (!buttonConfig) {
    return {};
  }

  const backgroundColor =
    buttonConfig.actionBtnColor || buttonConfig.color || undefined;
  const textColor =
    buttonConfig.actionBtnTextColor || buttonConfig.textColor || undefined;
  const borderColor =
    buttonConfig.borderColor ||
    (backgroundColor
      ? `color-mix(in srgb, ${backgroundColor} 78%, ${textColor || 'currentColor'})`
      : undefined);

  return getBiolinkButtonStyle({
    btnConfig: {
      ...buttonConfig,
      variant: 'solid',
      color: backgroundColor,
      textColor,
      borderColor,
      borderWidth: Math.max(1, buttonConfig.borderWidth ?? 1),
      bgTransparency: Math.min(buttonConfig.bgTransparency ?? 0, 20),
      backgroundImage: undefined,
      borderImage: undefined,
      blockStyle: undefined,
    },
  });
}

function OfferCard({
  item,
  buttonLabel,
  offerType,
  layout,
  utm,
  mutedColor,
  linkColor,
  productStyle,
  itemStyle,
  buttonConfig,
  actionIcon,
}: {
  item: BiolinkWidgetItem;
  buttonLabel?: string;
  offerType: NewWidgetType;
  layout: ReturnType<typeof normalizeCollectionLayout>;
  utm?: string | null;
  mutedColor?: string;
  linkColor?: string;
  productStyle?: ProductStyle;
  itemStyle?: CollectionItemStyle;
  buttonConfig?: BiolinkAppearanceConfig['btnConfig'];
  actionIcon?: ReactNode;
}) {
  const price = formatPrice(item.price, item.currency);
  const currentPrice = Number(item.price);
  const merchandising = readMerchandising(item.payload);
  const sourceDomain =
    offerType !== 'linkedProduct' &&
    item.payload &&
    typeof item.payload === 'object' &&
    typeof item.payload.domain === 'string' &&
    item.payload.domain.trim()
      ? item.payload.domain.trim()
      : null;
  const hasDiscount =
    item.price !== null &&
    item.price !== undefined &&
    item.price !== '' &&
    merchandising.comparePrice !== null &&
    Number.isFinite(currentPrice) &&
    currentPrice >= 0 &&
    merchandising.comparePrice > currentPrice;
  const comparePrice = hasDiscount
    ? formatPrice(merchandising.comparePrice, item.currency)
    : null;
  const discountPercentage =
    hasDiscount &&
    merchandising.comparePrice !== null &&
    merchandising.comparePrice > 0
      ? Math.max(
          1,
          Math.round(
            ((merchandising.comparePrice - currentPrice) /
              merchandising.comparePrice) *
              100,
          ),
        )
      : null;
  const href = applyUtmToUrl(item.url, utm);
  const featured = layout === 'card';
  const compact = layout === 'grid' || layout === 'slide';
  const cardVariant = productStyle?.cardVariant ?? 'standard';
  const isPoster = cardVariant === 'poster';
  const isMinimal = cardVariant === 'minimal';
  const imagePosition =
    cardVariant === 'media' || isPoster
      ? 'top'
      : cardVariant === 'compact'
        ? 'left'
        : (productStyle?.imagePosition ??
          (featured || compact ? 'top' : 'left'));
  const imageSize = productStyle?.imageSize ?? 'medium';
  const showImages = productStyle?.showImages ?? true;
  const showImageFallback = productStyle?.showImageFallback ?? false;
  const actionStyle = productStyle?.actionStyle ?? 'text';
  const pricePosition = productStyle?.pricePosition ?? 'inline';
  const stackedImage = imagePosition === 'top';
  const hasImage = showImages && !!item.image;
  const showImage = hasImage || (showImages && showImageFallback);
  const imageClassName = cn(
    'shrink-0 object-cover',
    stackedImage
      ? 'aspect-square w-full'
      : imageSize === 'small'
        ? 'size-12'
        : imageSize === 'large'
          ? 'size-24'
          : 'size-16',
  );
  const imageStyle = {
    borderRadius: `${productStyle?.imageRadius ?? 8}px`,
  } satisfies CSSProperties;
  const sharedItemStyle = itemStyleCss({
    ...itemStyle,
    backgroundColor:
      productStyle?.backgroundColor ?? itemStyle?.backgroundColor,
    textColor: productStyle?.textColor ?? itemStyle?.textColor,
    borderColor: productStyle?.borderColor ?? itemStyle?.borderColor,
    transparency: productStyle?.transparency ?? itemStyle?.transparency,
    borderWidth: productStyle?.borderWidth ?? itemStyle?.borderWidth,
    shadow: productStyle?.shadow ?? itemStyle?.shadow,
    shadowColor: productStyle?.shadowColor ?? itemStyle?.shadowColor,
    radius: productStyle?.radius ?? itemStyle?.radius,
    fontFamily: productStyle?.fontFamily ?? itemStyle?.fontFamily,
  });
  const showBackground = !isMinimal && (productStyle?.showBackground ?? true);

  const cardStyle = {
    ...sharedItemStyle,
    backgroundColor: !showBackground
      ? 'transparent'
      : sharedItemStyle?.backgroundColor ||
        `color-mix(in srgb, currentColor ${Math.max(4, Math.min(16, 16 - (productStyle?.cardTransparency ?? 0) / 6))}%, transparent)`,
    borderWidth: !showBackground
      ? '0px'
      : sharedItemStyle?.borderWidth ||
        `${productStyle?.cardBorderWidth ?? 1}px`,
    boxShadow: !showBackground
      ? 'none'
      : sharedItemStyle?.boxShadow ||
        (productStyle?.cardGlow
          ? '0 0 18px color-mix(in srgb, currentColor 24%, transparent)'
          : undefined),
  } satisfies CSSProperties;
  const actionButtonStyle = productActionButtonStyle(buttonConfig);
  const discountBadgeStyle = {
    ...actionButtonStyle,
    borderRadius: '9999px',
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.18)',
  } satisfies CSSProperties;
  const discountBadge =
    discountPercentage !== null ? (
      <span
        className="inline-flex min-h-7 items-center rounded-full border border-primary bg-primary px-2.5 text-xs font-bold text-primary-foreground"
        style={discountBadgeStyle}
      >
        -{discountPercentage}%
      </span>
    ) : null;
  const contentClassName = cn('flex gap-3', stackedImage && 'flex-col');
  const commerceDetails = (
    <div
      className={cn(
        'mt-3 flex items-center justify-between gap-3 text-sm',
        compact && !isPoster && 'items-start text-xs',
        stackedImage &&
          actionStyle === 'button' &&
          'flex-col items-stretch gap-3',
        pricePosition === 'below' && 'flex-col items-start',
        !showBackground && 'mt-3 font-medium',
      )}
      style={{color: mutedColor}}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {price ? (
            <span
              className={cn(
                'font-semibold',
                isPoster && 'text-xl leading-none font-bold',
              )}
              style={{color: linkColor}}
            >
              {price}
            </span>
          ) : null}
          {comparePrice ? (
            <span className="text-xs line-through opacity-60">
              {comparePrice}
            </span>
          ) : null}
        </span>
        {merchandising.stockLabel ? (
          <span className="mt-1 block text-xs opacity-75">
            {merchandising.stockLabel}
          </span>
        ) : null}
      </span>
      {actionStyle === 'icon' ? (
        <span
          aria-label={buttonLabel}
          className="biolink-btn-custom flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary bg-primary text-primary-foreground transition-[filter,transform] duration-200 group-hover:brightness-105 group-active:brightness-95 motion-reduce:transition-none"
          style={actionButtonStyle}
        >
          {actionIcon ?? <ShoppingCartIcon className="size-5" />}
        </span>
      ) : actionStyle === 'button' ? (
        <span
          className={cn(
            'biolink-btn-custom inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter,transform] duration-200 group-hover:brightness-105 group-active:brightness-95 motion-reduce:transition-none',
            stackedImage && 'min-h-11 w-full',
          )}
          style={actionButtonStyle}
        >
          {actionIcon ?? <ShoppingCartIcon className="mr-2 size-4" />}
          {buttonLabel}
        </span>
      ) : (
        <span className="shrink-0 font-semibold" style={{color: linkColor}}>
          {buttonLabel}
        </span>
      )}
    </div>
  );

  if (isPoster) {
    return (
      <a
        href={href || undefined}
        className={cn(
          'biolink-product-card group flex flex-col overflow-hidden rounded-xl border text-inherit no-underline transition-[box-shadow,transform] duration-300 outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current active:scale-[0.99]',
          layout === 'slide' && 'w-[82%] max-w-80 min-w-64 shrink-0 snap-start',
          showImage ? 'min-h-[24rem]' : 'min-h-44',
        )}
        style={cardStyle}
        target="_blank"
        rel="noreferrer"
      >
        {showImage ? (
          <div
            className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-current/10"
            style={{
              borderRadius: `${productStyle?.imageRadius ?? 0}px ${productStyle?.imageRadius ?? 0}px 0 0`,
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title || ''}
                className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-current/10"
              >
                <ImageIcon className="size-10 opacity-35" />
              </span>
            )}
            {discountBadge ? (
              <span className="absolute top-3 left-3">{discountBadge}</span>
            ) : null}
            {merchandising.rating !== null ? (
              <span
                className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black shadow-sm"
                aria-label={`${merchandising.rating.toFixed(1)} / 5`}
              >
                <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                {merchandising.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col p-4">
          {merchandising.badge ||
          sourceDomain ||
          (!showImage && discountBadge) ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {!showImage ? discountBadge : null}
              {merchandising.badge ? (
                <span className="inline-flex max-w-full truncate rounded-full border border-current/20 bg-current/[0.06] px-2.5 py-1 text-xs font-semibold">
                  {merchandising.badge}
                </span>
              ) : null}
              {sourceDomain ? (
                <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium opacity-70">
                  <ExternalLinkIcon className="size-3 shrink-0" />
                  <span className="truncate">{sourceDomain}</span>
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="line-clamp-2 text-base leading-snug font-bold text-balance">
            {item.title}
          </div>
          {!showImage && merchandising.rating !== null ? (
            <RatingLabel rating={merchandising.rating} />
          ) : null}
          {item.description ? (
            <div
              className={cn(
                'mt-1 line-clamp-2 text-sm leading-5',
                !mutedColor && 'opacity-80',
              )}
              style={{color: mutedColor}}
            >
              {item.description}
            </div>
          ) : null}
          <div className="mt-auto">{commerceDetails}</div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={href || undefined}
      className={cn(
        'biolink-product-card block text-inherit no-underline transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]',
        showBackground &&
          'biolink-surface-item rounded-lg border hover:shadow-xl',
        !showBackground && 'hover:opacity-90',
        productStyle?.cardGlow && showBackground && 'biolink-product-card-glow',
        // In slide mode: show a peek of the next card using a slightly narrower width
        layout === 'slide' &&
          'w-[78%] max-w-72 min-w-52 shrink-0 snap-start overflow-hidden',
        // In grid/featured mode
        (layout === 'grid' || layout === 'card') && 'overflow-hidden',
        // Padding: no top padding when image is stacked on top
        !showBackground
          ? stackedImage
            ? 'p-0 pb-2'
            : 'p-2'
          : stackedImage
            ? 'p-0'
            : featured
              ? 'p-4'
              : compact
                ? 'p-2'
                : 'p-3',
      )}
      style={cardStyle}
      target="_blank"
      rel="noreferrer"
    >
      {/* Hero image – full-width when stacked (slide/grid/card layout) */}
      {showImage && stackedImage ? (
        <div
          className="relative w-full overflow-hidden"
          style={{
            borderRadius: `${productStyle?.imageRadius ?? 0}px ${productStyle?.imageRadius ?? 0}px 0 0`,
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title || ''}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span
              aria-hidden
              className="flex aspect-[4/3] w-full items-center justify-center border-b border-current/10 bg-current/10"
            >
              <ImageIcon className="size-8 opacity-40" />
            </span>
          )}
          {discountBadge ? (
            <span className="absolute top-3 left-3">{discountBadge}</span>
          ) : null}
        </div>
      ) : null}
      <div className={cn(contentClassName, stackedImage && 'p-3')}>
        {/* Inline image (line layout) */}
        {showImage && !stackedImage ? (
          item.image ? (
            <img
              src={item.image}
              alt={item.title || ''}
              className={imageClassName}
              style={imageStyle}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span
              aria-hidden
              className={cn(
                imageClassName,
                'grid place-items-center border border-current/15 bg-current/10',
              )}
              style={imageStyle}
            >
              <ImageIcon className="size-5 opacity-60" />
            </span>
          )
        ) : null}
        <div className="min-w-0 flex-1">
          {merchandising.badge ||
          sourceDomain ||
          ((!showImage || !stackedImage) && discountBadge) ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {!showImage || !stackedImage ? discountBadge : null}
              {merchandising.badge ? (
                <span className="inline-flex max-w-full truncate rounded-full border border-current/20 bg-current/[0.06] px-2 py-0.5 text-[11px] font-semibold">
                  {merchandising.badge}
                </span>
              ) : null}
              {sourceDomain ? (
                <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium opacity-70">
                  <ExternalLinkIcon className="size-3 shrink-0" />
                  <span className="truncate">{sourceDomain}</span>
                </span>
              ) : null}
            </div>
          ) : null}
          <div
            className={cn(
              'font-semibold',
              !showBackground && 'text-lg tracking-tight',
              compact && 'line-clamp-2 text-sm',
              compact && !showBackground && 'text-base',
            )}
          >
            {item.title}
          </div>
          {merchandising.rating !== null ? (
            <RatingLabel rating={merchandising.rating} />
          ) : null}
          {item.description ? (
            <div
              className={cn(
                'mt-1 line-clamp-2 text-sm',
                !showBackground && 'text-sm opacity-90',
                !mutedColor && 'opacity-80',
              )}
              style={{color: mutedColor}}
            >
              {item.description}
            </div>
          ) : null}
          {commerceDetails}
        </div>
      </div>
    </a>
  );
}

export function FaqWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const items = widget.items ?? [];

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.faq.defaultTitle}
          />
        </div>
        <div>
          {items.length} <Trans message="questions" />
        </div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.faq} />
      <div className="space-y-2">
        {items.map(item => (
          <details
            key={item.id}
            className="biolink-surface-item group overflow-hidden rounded-lg border text-inherit transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold outline-none focus-visible:bg-current/5">
              {item.title}
              <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            {item.description ? (
              <div className="animate-accordion-down border-t border-current/10 bg-current/5 p-4 text-sm leading-relaxed opacity-90">
                {item.description}
              </div>
            ) : null}
          </details>
        ))}
      </div>
    </BiolinkWidgetSurface>
  );
}

export function LinkCollectionWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
  biolink,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const items = widget.items ?? [];
  const layoutInfo = collectionLayoutClasses(widget.config.layout);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.linkCollection.defaultTitle}
          />
        </div>
        <div>
          {items.length} <Trans message="links" />
        </div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.linkCollection} />
      <CollectionItems layout={layoutInfo.layout}>
        {items.map(item => {
          const showMedia =
            !!item.image || appearance?.cardConfig?.showImageFallback === true;

          return (
            <LinkButton
              key={item.id}
              to={item.url ?? '#'}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              className={cn(
                layoutInfo.item,
                'biolink-surface-item min-h-14 justify-between gap-3 px-4 py-3 text-inherit transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]',
                layoutInfo.layout !== 'slide' && 'w-full',
              )}
              style={itemStyleCss(
                resolveCollectionItemStyle(appearance, widget.config.itemStyle),
              )}
            >
              <span className="flex min-w-0 items-center gap-3 text-left">
                {showMedia ? (
                  <ResilientContentImage
                    src={item.image}
                    seedParts={[biolink?.id, widget.id, item.id]}
                    alt=""
                    className="size-11 shrink-0 rounded-md object-cover"
                    showPlaceholder={
                      appearance?.cardConfig?.showImageFallback === true
                    }
                  />
                ) : null}
                <span className="min-w-0">
                  <span className="block wrap-break-word">{item.title}</span>
                  {item.description ? (
                    <span className="mt-0.5 line-clamp-2 block text-xs opacity-70">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </span>
              <LinkIcon className="size-4 shrink-0" />
            </LinkButton>
          );
        })}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );
}

export function EmbedCollectionWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const items = (widget.items ?? []).filter(
    item => String(item.active) !== '0' && String(item.active) !== 'false',
  );
  const layoutInfo = collectionLayoutClasses(widget.config.layout);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.embedCollection.defaultTitle}
          />
        </div>
        <div>
          {items.length} <Trans message="rich previews" />
        </div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.embedCollection} />
      <CollectionItems layout={layoutInfo.layout}>
        {items.map(item => (
          <EmbedPreviewCard
            key={item.id}
            item={item}
            layout={layoutInfo.layout}
            className={layoutInfo.item}
            density={widget.config.previewStyle ?? 'compact'}
            style={itemStyleCss(
              resolveCollectionItemStyle(appearance, widget.config.itemStyle),
            )}
          />
        ))}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );
}

type EmbedProvider = EmbedMetadata['provider'];

function EmbedPreviewCard({
  item,
  layout,
  density,
  className,
  style,
}: {
  item: BiolinkWidgetItem;
  layout: CollectionLayout;
  density: 'compact' | 'comfortable';
  className: string;
  style?: CSSProperties;
}) {
  const payload = (item.payload ?? {}) as {
    provider?: EmbedProvider;
    domain?: string;
  };
  const inferredProvider = inferEmbedProvider(item.url);
  const provider =
    inferredProvider === 'other'
      ? (payload.provider ?? inferredProvider)
      : inferredProvider;
  const domain = embedDomain(item.url) || payload.domain || '';
  const isStacked = layout !== 'line';
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!item.image && !imageFailed;

  return (
    <a
      href={item.url ?? '#'}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        className,
        'biolink-surface-item group relative flex min-w-0 overflow-hidden border border-current/15 bg-current/5 text-left text-inherit shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-current/30 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:translate-y-0 active:scale-[0.99]',
        isStacked ? 'flex-col' : 'items-stretch',
        density === 'compact' && !isStacked ? 'min-h-24' : 'min-h-30',
      )}
      style={style}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-current/10',
          isStacked
            ? 'aspect-[16/10] w-full'
            : density === 'compact'
              ? 'w-24 @2xl:w-28'
              : 'w-28 @2xl:w-36',
        )}
      >
        {showImage ? (
          <img
            src={item.image ?? undefined}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <EmbedProviderArtwork provider={provider} />
        )}
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          density === 'compact' ? 'p-3' : 'p-4',
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'line-clamp-2 font-semibold tracking-[-0.01em]',
                density === 'compact' ? 'text-sm' : 'text-base',
              )}
            >
              {item.title || domain || embedProviderLabel(provider)}
            </div>
            {item.description ? (
              <div
                className={cn(
                  'mt-1 leading-snug opacity-70',
                  density === 'compact'
                    ? 'line-clamp-2 text-xs'
                    : 'line-clamp-3 text-sm',
                )}
              >
                {item.description}
              </div>
            ) : null}
          </div>
          <ExternalLinkIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 opacity-45 transition-opacity group-hover:opacity-85"
          />
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2 text-xs font-medium opacity-75">
          <EmbedProviderIcon provider={provider} />
          <span className="truncate">
            {domain || embedProviderLabel(provider)}
          </span>
        </div>
      </div>
    </a>
  );
}

function EmbedProviderArtwork({provider}: {provider: EmbedProvider}) {
  const socialType = embedProviderSocialType(provider);
  const social = socialType ? SocialsList[socialType] : null;

  return (
    <span
      aria-hidden
      className="absolute inset-0 grid place-items-center"
      style={social?.brandStyle}
    >
      <span
        className={cn(
          'grid size-12 place-items-center rounded-2xl border border-current/15 bg-current/10 [&>svg]:size-6',
          !social && 'text-current',
        )}
      >
        {social?.icon ?? <LinkIcon />}
      </span>
    </span>
  );
}

function EmbedProviderIcon({provider}: {provider: EmbedProvider}) {
  const socialType = embedProviderSocialType(provider);
  const social = socialType ? SocialsList[socialType] : null;

  return (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-md border border-current/10 [&>svg]:size-3"
      style={social?.brandStyle}
    >
      {social?.icon ?? <LinkIcon />}
    </span>
  );
}

function embedProviderSocialType(
  provider: EmbedProvider,
): SocialsType | undefined {
  return (
    {
      instagram: SocialsType.Instagram,
      tiktok: SocialsType.Tiktok,
      youtube: SocialsType.Youtube,
      facebook: SocialsType.Facebook,
      x: SocialsType.Twitter,
      linkedin: SocialsType.LinkedIn,
      spotify: SocialsType.Spotify,
      soundcloud: SocialsType.Soundcloud,
    } as Partial<Record<EmbedProvider, SocialsType>>
  )[provider];
}

function inferEmbedProvider(url?: string | null): EmbedProvider {
  const domain = embedDomain(url);

  if (domain.endsWith('instagram.com')) return 'instagram';
  if (domain.endsWith('tiktok.com')) return 'tiktok';
  if (
    domain.endsWith('youtube.com') ||
    domain.endsWith('youtu.be') ||
    domain.endsWith('youtube-nocookie.com')
  ) {
    return 'youtube';
  }
  if (domain.endsWith('facebook.com') || domain.endsWith('fb.watch')) {
    return 'facebook';
  }
  if (domain.endsWith('x.com') || domain.endsWith('twitter.com')) return 'x';
  if (domain.endsWith('linkedin.com')) return 'linkedin';
  if (domain.endsWith('spotify.com') || domain.endsWith('spotify.link')) {
    return 'spotify';
  }
  if (domain.endsWith('soundcloud.com')) return 'soundcloud';
  return 'other';
}

function embedDomain(url?: string | null): string {
  if (!url) return '';

  try {
    return new URL(url).hostname.replace(/^www\./, '').toLocaleLowerCase();
  } catch {
    return '';
  }
}

function embedProviderLabel(provider: EmbedProvider): string {
  return (
    {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      facebook: 'Facebook',
      x: 'X',
      linkedin: 'LinkedIn',
      spotify: 'Spotify',
      soundcloud: 'SoundCloud',
      other: 'Link',
    } as Record<EmbedProvider, string>
  )[provider];
}

// Helper to resolve gallery aspect ratio class
function galleryAspectRatioClass(aspectRatio?: string | null): string {
  switch (aspectRatio) {
    case 'square':
      return 'aspect-square';
    case '16/9':
      return 'aspect-video';
    case 'portrait':
      return 'aspect-[3/4]';
    case '4/3':
    default:
      return 'aspect-[4/3]';
  }
}

function ResilientContentImage({
  src,
  seedParts,
  alt,
  className,
  showPlaceholder,
}: {
  src?: string | null;
  seedParts: Array<string | number | null | undefined>;
  alt: string;
  className: string;
  showPlaceholder: boolean;
}) {
  const placeholder = showPlaceholder
    ? getBiolinkPlaceholderUrl('content', seedParts)
    : undefined;
  const imageState = useResilientImageSources([src, placeholder]);

  if (imageState.failed || !imageState.src) {
    return (
      <span
        aria-hidden
        className={cn(
          className,
          'flex items-center justify-center bg-current/10',
        )}
      >
        <ImageIcon className="size-5 opacity-45" />
      </span>
    );
  }

  return (
    <img
      src={imageState.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={imageState.onError}
    />
  );
}

export function ImageGalleryWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
  biolink,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const items = widget.items ?? [];
  const layoutInfo = collectionLayoutClasses(widget.config.layout);
  const gridColumns = Number(widget.config.gridColumns) || 2;
  const aspectClass = galleryAspectRatioClass(widget.config.aspectRatio);

  const galleryListClass =
    layoutInfo.layout === 'grid'
      ? cn(
          'grid gap-3 @2xl:gap-4',
          gridColumns === 1
            ? 'grid-cols-1'
            : gridColumns === 3
              ? 'grid-cols-2 @2xl:grid-cols-3'
              : 'grid-cols-2',
        )
      : undefined;

  const imageZoomEnabled = widget.config.imageZoom !== false;
  const imageIndexByItemId = new Map<number, number>();
  const galleryImages = items.reduce<string[]>((images, item) => {
    if (item.image) {
      imageIndexByItemId.set(item.id, images.length);
      images.push(item.image);
    }
    return images;
  }, []);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.imageGallery.defaultTitle}
          />
        </div>
        <div>
          {items.length} <Trans message="images" />
        </div>
      </div>
    );
  }

  const gallery = (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.imageGallery} />
      <CollectionItems layout={layoutInfo.layout} className={galleryListClass}>
        {items.map(item => {
          const imageIndex = imageIndexByItemId.get(item.id) ?? -1;
          const showMedia =
            !!item.image || appearance?.cardConfig?.showImageFallback === true;
          const imgEl = showMedia ? (
            <ResilientContentImage
              src={item.image}
              seedParts={[biolink?.id, widget.id, item.id]}
              alt={item.title || ''}
              showPlaceholder={
                appearance?.cardConfig?.showImageFallback === true
              }
              className={cn(
                'block w-full rounded-md object-cover transition-transform duration-200 ease-out',
                aspectClass,
                layoutInfo.layout !== 'line' &&
                  imageZoomEnabled &&
                  'group-hover:scale-[1.025]',
              )}
            />
          ) : null;

          const image = showMedia ? (
            imageZoomEnabled && imageIndex >= 0 ? (
              <button
                type="button"
                className={cn(
                  'relative block cursor-zoom-in overflow-hidden rounded-md text-left focus-visible:outline-2 focus-visible:outline-current',
                  layoutInfo.layout === 'line'
                    ? 'w-32 shrink-0 @2xl:w-40'
                    : 'w-full',
                )}
                aria-label={item.title || trans({message: 'Open image'})}
                onClick={() => {
                  setActiveImageIndex(imageIndex);
                  setZoomOpen(true);
                }}
              >
                {imgEl}
                {/* Zoom overlay */}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="flex items-center justify-center rounded-full bg-black/55 p-2 backdrop-blur-sm">
                    <ZoomInIcon className="size-4 text-white" />
                  </span>
                </span>
              </button>
            ) : (
              imgEl
            )
          ) : null;

          return (
            <div
              key={item.id}
              className={cn(
                layoutInfo.item,
                'biolink-gallery-item biolink-surface-item group relative min-w-0 overflow-hidden rounded-lg border p-1.5',
                layoutInfo.layout === 'line' && 'flex items-center gap-3',
              )}
              style={itemStyleCss(
                resolveCollectionItemStyle(appearance, widget.config.itemStyle),
              )}
            >
              {item.url && !imageZoomEnabled ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.title || undefined}
                >
                  {image}
                </a>
              ) : (
                image
              )}
              {item.url && imageZoomEnabled ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md bg-black/65 text-white no-underline transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-white"
                  aria-label={trans({message: 'Open link'})}
                  title={trans({message: 'Open link'})}
                >
                  <ExternalLinkIcon className="size-3.5" />
                  <span className="sr-only">
                    <Trans message="Open link" />
                  </span>
                </a>
              ) : null}
              {item.title || item.description ? (
                <div
                  className={cn('px-2.5 pt-2.5 pb-2', !item.image && 'pt-3')}
                >
                  {item.title ? (
                    <div className="line-clamp-2 text-sm leading-5 font-semibold">
                      {item.title}
                    </div>
                  ) : null}
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 opacity-75">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );

  return imageZoomEnabled && galleryImages.length > 0 ? (
    <ImageZoomDialog
      images={galleryImages}
      activeIndex={activeImageIndex}
      onActiveIndexChange={setActiveImageIndex}
      open={zoomOpen}
      onOpenChange={setZoomOpen}
    >
      {gallery}
    </ImageZoomDialog>
  ) : (
    gallery
  );
}

export function QrCodeWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const value = widget.config.value;
  const [open, setOpen] = useState(false);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.qrCode.defaultTitle}
          />
        </div>
        <div className="truncate">{value}</div>
      </div>
    );
  }

  if (!value) {
    return null;
  }

  const qrCode = (
    <QrCodeRenderer url={value} size={180} className="flex justify-center" />
  );
  const display = widget.config.qrDisplay ?? 'card';
  const showHeading = shouldShowBiolinkSectionHeading(widget.config.section);

  if (display === 'code') {
    return <div className="w-full py-1 text-center">{qrCode}</div>;
  }

  if (display === 'button') {
    return (
      <>
        <PublicActionButton
          appearance={appearance}
          icon={<QrCodeIcon />}
          title={
            showHeading
              ? translatedWidgetText(
                  widget.config.title,
                  widgetCopy.qrCode.defaultTitle,
                  trans,
                )
              : null
          }
          description={
            showHeading
              ? widget.config.description || widget.config.label
              : null
          }
          onClick={() => setOpen(true)}
        />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="bg-black/75" />
            <Dialog.Content className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-lg bg-background p-0 text-foreground shadow-lg @2xl:max-w-sm">
              <Dialog.Header className="border-b px-6 py-5 pe-14 text-center">
                <Dialog.Title className="justify-center text-base">
                  <WidgetDefaultText
                    value={widget.config.title}
                    fallback={widgetCopy.qrCode.defaultTitle}
                  />
                </Dialog.Title>
                {widget.config.description ? (
                  <Dialog.Description className="text-center">
                    {widget.config.description}
                  </Dialog.Description>
                ) : null}
              </Dialog.Header>
              <div className="space-y-3 px-6 py-6 text-center">
                {qrCode}
                {widget.config.label ? (
                  <div className="text-sm text-muted-foreground">
                    {widget.config.label}
                  </div>
                ) : null}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 text-center @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.qrCode} />
      {qrCode}
      {widget.config.label ? (
        <div className="mt-2 text-sm opacity-80">{widget.config.label}</div>
      ) : null}
    </BiolinkWidgetSurface>
  );
}

export function LocationWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;

  const formattedAddress = buildFormattedAddress(widget.config);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.location.defaultTitle}
          />
        </div>
        <div className="truncate">
          {formattedAddress || widget.config.address}
        </div>
      </div>
    );
  }

  const coordinates = parseCoordinates(
    widget.config.latitude,
    widget.config.longitude,
  );

  const displayAddress = formattedAddress || widget.config.address || '';
  const showHeading = shouldShowBiolinkSectionHeading(widget.config.section);
  const mapUrl = applyUtmToUrl(
    buildMapDestinationUrl({
      provider: widget.config.mapProvider,
      address: displayAddress,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      customUrl: widget.config.url,
    }),
    widget.utm,
  );

  if (!mapUrl && !coordinates) {
    return null;
  }

  // Map content — Leaflet when we have coordinates, iframe embed fallback, or placeholder
  const mapContent = coordinates ? (
    <div
      className="relative aspect-video w-full overflow-hidden"
      style={{
        borderRadius: 'var(--biolink-widget-radius, var(--radius-lg, 0.75rem))',
      }}
    >
      <LeafletMap
        latitude={Number(coordinates.latitude)}
        longitude={Number(coordinates.longitude)}
        address={displayAddress}
        className="h-full w-full"
      />
    </div>
  ) : mapUrl && canEmbedMapUrl(mapUrl) ? (
    <div
      className="relative aspect-video w-full overflow-hidden bg-current/5 shadow-inner"
      style={{
        borderRadius: 'var(--biolink-widget-radius, var(--radius-lg, 0.75rem))',
      }}
    >
      <div className="absolute inset-0 animate-pulse bg-current/10" />
      <iframe
        title={translatedWidgetText(
          widget.config.title,
          widgetCopy.location.defaultTitle,
          trans,
        )}
        src={mapUrl}
        className="relative z-10 block h-full w-full border-0 bg-transparent"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  ) : (
    <div
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-current/5 p-6 text-center shadow-inner"
      style={{
        borderRadius: 'var(--biolink-widget-radius, var(--radius-lg, 0.75rem))',
      }}
    >
      <MapPinIcon className="size-10 opacity-20" />
      <div className="text-sm opacity-70">
        <Trans message="Map preview not available. Please open the link below." />
      </div>
    </div>
  );

  if (widget.config.mapDisplay === 'modal') {
    return (
      <Dialog.Root>
        <Dialog.Trigger
          render={
            <PublicActionButton
              appearance={appearance}
              icon={<MapPinIcon />}
              title={
                showHeading
                  ? translatedWidgetText(
                      widget.config.title,
                      widgetCopy.location.defaultTitle,
                      trans,
                    )
                  : null
              }
              description={
                showHeading ? widget.config.description || displayAddress : null
              }
            />
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content className="w-[90vw] max-w-2xl @2xl:w-full">
            <Dialog.Header>
              <Dialog.Title>
                <WidgetDefaultText
                  value={widget.config.title}
                  fallback={widgetCopy.location.defaultTitle}
                />
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body className="p-4 @2xl:p-5">
              {mapContent}

              {displayAddress ? (
                <div className="mt-4 text-sm leading-relaxed font-medium opacity-90">
                  {displayAddress}
                </div>
              ) : null}

              {widget.config.description ? (
                <div className="mt-1 text-sm leading-relaxed opacity-70">
                  {widget.config.description}
                </div>
              ) : null}
            </Dialog.Body>
            <Dialog.Footer className="flex items-center gap-2 px-4 py-3 @2xl:px-5">
              <Dialog.CloseButton>
                <Trans message="Close" />
              </Dialog.CloseButton>
              {mapUrl ? (
                <LinkButton
                  className="w-full flex-1 @2xl:w-auto"
                  to={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {widget.config.buttonLabel ||
                    (widgetCopy.location.defaultButton ? (
                      <Trans {...widgetCopy.location.defaultButton} />
                    ) : null)}
                  <ExternalLinkIcon className="ml-2 size-4" />
                </LinkButton>
              ) : null}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  if (widget.config.mapDisplay === 'iframe') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="overflow-hidden !border-0 !bg-transparent !p-0"
        style={{borderWidth: 0}}
      >
        {mapContent}
        {showHeading && (displayAddress || widget.config.title) ? (
          <div className="px-3 pt-3 pb-3 @2xl:px-4 @2xl:pb-4">
            {widget.config.title ? (
              <div className="line-clamp-2 text-sm leading-5 font-semibold">
                {widget.config.title}
              </div>
            ) : null}
            {displayAddress ? (
              <div
                className={cn(
                  'flex items-start gap-1.5 text-xs leading-4 opacity-75',
                  widget.config.title && 'mt-1.5',
                )}
              >
                <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
                <span className="line-clamp-2">{displayAddress}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </BiolinkWidgetSurface>
    );
  }

  return (
    <PublicActionButton
      appearance={appearance}
      href={mapUrl}
      icon={<MapPinIcon />}
      title={
        showHeading
          ? translatedWidgetText(
              widget.config.title,
              widgetCopy.location.defaultTitle,
              trans,
            )
          : null
      }
      description={
        showHeading ? widget.config.description || displayAddress : null
      }
    />
  );
}

export function ContactCardWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const details = [
    widget.config.occupation,
    widget.config.email,
    widget.config.phone,
    widget.config.whatsapp,
    widget.config.address,
    widget.config.hours,
  ].filter(Boolean);
  const [open, setOpen] = useState(false);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.contactCard.defaultTitle}
          />
        </div>
        <div className="truncate">
          {widget.config.name || details[0] || (
            <Trans message="Contact details" />
          )}
        </div>
      </div>
    );
  }

  const contactUrl =
    widget.config.url ||
    (widget.config.whatsapp ? whatsappUrl(widget.config.whatsapp) : '') ||
    (widget.config.email ? `mailto:${widget.config.email}` : '') ||
    (widget.config.phone ? `tel:${widget.config.phone}` : '');
  const contactRows: Array<{
    key: string;
    label: ReactNode;
    value: string;
    icon: ReactNode;
    href?: string;
  }> = [
    {
      key: 'occupation',
      label: <Trans message="Occupation" />,
      value: widget.config.occupation ?? '',
      icon: <BriefcaseBusinessIcon />,
    },
    {
      key: 'email',
      label: <Trans message="Email" />,
      value: widget.config.email ?? '',
      icon: <MailIcon />,
      href: widget.config.email ? `mailto:${widget.config.email}` : undefined,
    },
    {
      key: 'phone',
      label: <Trans message="Phone" />,
      value: widget.config.phone ?? '',
      icon: <PhoneCallIcon />,
      href: widget.config.phone ? `tel:${widget.config.phone}` : undefined,
    },
    {
      key: 'whatsapp',
      label: <Trans message="WhatsApp" />,
      value: widget.config.whatsapp ?? '',
      icon: <MessageCircleIcon />,
      href: widget.config.whatsapp
        ? whatsappUrl(widget.config.whatsapp)
        : undefined,
    },
    {
      key: 'address',
      label: <Trans message="Address" />,
      value: widget.config.address ?? '',
      icon: <MapPinIcon />,
    },
    {
      key: 'hours',
      label: <Trans message="Hours" />,
      value: widget.config.hours ?? '',
      icon: <Clock3Icon />,
    },
  ].filter(row => !!row.value);

  if (
    widget.config.presentation === 'inline' ||
    widget.config.presentation === 'business'
  ) {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
      >
        <WidgetSectionHeader widget={widget} copy={widgetCopy.contactCard} />
        {widget.config.name ? (
          <div className="mb-3 font-semibold">{widget.config.name}</div>
        ) : null}
        {contactRows.length ? (
          <dl
            className={cn(
              'grid gap-x-5 gap-y-3 text-sm',
              widget.config.presentation === 'business' && '@2xl:grid-cols-2',
            )}
          >
            {contactRows.map(({key, label, value, icon, href}) => (
              <div key={key} className="flex min-w-0 items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-current/8 [&_svg]:size-4">
                  {icon}
                </span>
                <div className="min-w-0 pt-0.5">
                  <dt className="text-xs font-medium opacity-65">{label}</dt>
                  <dd className="mt-0.5 wrap-break-word">
                    {href ? (
                      <a
                        href={href}
                        className="underline-offset-2 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        ) : null}
        {contactUrl ? (
          <PublicActionButton
            appearance={appearance}
            icon={<ExternalLinkIcon />}
            title={translatedWidgetText(
              widget.config.buttonLabel,
              widgetCopy.contactCard.defaultButton,
              trans,
            )}
            href={applyUtmToUrl(contactUrl, widget.utm) ?? contactUrl}
            inSurface
            className="mt-4 min-h-12 py-2"
          />
        ) : null}
        {widget.config.enableVcard ? (
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => downloadContactVcard(widget.config)}
          >
            <DownloadIcon />
            <Trans message="Save contact" />
          </Button>
        ) : null}
      </BiolinkWidgetSurface>
    );
  }

  return (
    <>
      <PublicActionButton
        appearance={appearance}
        icon={<ContactIcon />}
        title={translatedWidgetText(
          widget.config.buttonLabel,
          widgetCopy.contactCard.defaultButton,
          trans,
        )}
        description={widget.config.description}
        onClick={() => setOpen(true)}
      />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="bg-black/75" />
          <Dialog.Content className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-background p-0 text-foreground shadow-2xl @2xl:max-w-md">
            <Dialog.Header className="border-b px-6 py-5 pe-14 text-center">
              <Dialog.Title className="justify-center text-base">
                <WidgetDefaultText
                  value={widget.config.title}
                  fallback={widgetCopy.contactCard.defaultTitle}
                />
              </Dialog.Title>
              {widget.config.description ? (
                <Dialog.Description className="text-center">
                  {widget.config.description}
                </Dialog.Description>
              ) : null}
            </Dialog.Header>
            <Dialog.Body className="space-y-4 px-6 py-5">
              {widget.config.name ? (
                <div className="text-center text-lg font-semibold">
                  {widget.config.name}
                </div>
              ) : null}
              {contactRows.length ? (
                <dl className="divide-y divide-border rounded-lg border">
                  {contactRows.map(({key, label, value, icon, href}) => (
                    <div
                      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-3"
                      key={key}
                    >
                      <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="mt-0.5 min-w-0 text-sm wrap-break-word">
                          {href ? (
                            <a
                              href={href}
                              className="underline-offset-2 hover:underline"
                            >
                              {value}
                            </a>
                          ) : (
                            value
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              ) : null}
              {contactUrl ? (
                <LinkButton
                  to={applyUtmToUrl(contactUrl, widget.utm) ?? contactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  {widget.config.buttonLabel ||
                    (widgetCopy.contactCard.defaultButton ? (
                      <Trans {...widgetCopy.contactCard.defaultButton} />
                    ) : null)}
                  <ExternalLinkIcon />
                </LinkButton>
              ) : null}
              {widget.config.enableVcard ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadContactVcard(widget.config)}
                >
                  <DownloadIcon />
                  <Trans message="Save contact" />
                </Button>
              ) : null}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function DiscountCodeWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const [copied, setCopied] = useState(false);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.discountCode.defaultTitle}
          />
        </div>
        <div className="truncate">{widget.config.code || '-'}</div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={widgetCopy.discountCode} />
      {widget.config.code ? (
        <button
          type="button"
          className="biolink-surface-item grid min-h-12 w-full grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm font-semibold tracking-wide focus-visible:outline-2 focus-visible:outline-current"
          onClick={() => {
            navigator.clipboard?.writeText(widget.config.code || '');
            setCopied(true);
          }}
        >
          <CopyIcon className="size-4" />
          {widget.config.code}
        </button>
      ) : null}
      {widget.config.expiresAt ? (
        <div className="mt-2 text-xs opacity-75">
          <Trans message="Valid until" /> {widget.config.expiresAt}
        </div>
      ) : null}
      {copied ? (
        <div
          className="mt-2 text-xs font-medium text-positive"
          aria-live="polite"
        >
          <Trans message="Copied" />
        </div>
      ) : null}
      {widget.config.url ? (
        <PublicActionButton
          appearance={appearance}
          icon={<ExternalLinkIcon />}
          title={translatedWidgetText(
            widget.config.buttonLabel,
            widgetCopy.discountCode.defaultButton,
            trans,
          )}
          href={
            applyUtmToUrl(widget.config.url, widget.utm) ?? widget.config.url
          }
          inSurface
          className="mt-3 min-h-12 py-2"
        />
      ) : null}
    </BiolinkWidgetSurface>
  );
}

export function SimpleLinkWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const copy = widgetCopy[widget.type];
  const href = applyUtmToUrl(widget.config.url, widget.utm);
  const videoPresentation =
    widget.type === 'genericVideo'
      ? (widget.config.presentation ?? 'embed')
      : null;
  const canEmbed =
    videoPresentation !== 'link' &&
    widget.config.embedMode === 'iframe' &&
    canIframeUrl(widget.config.url);
  const isVideo = widget.type === 'genericVideo';
  const isDirectVideo = isDirectVideoUrl(widget.config.url);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={copy.defaultTitle}
          />
        </div>
        <div className="truncate">{widget.config.url || '-'}</div>
      </div>
    );
  }

  if (!widget.config.url) {
    return null;
  }

  if (
    isVideo &&
    videoPresentation === 'featured' &&
    widget.config.playBehavior === 'inline' &&
    (isDirectVideo || canEmbed)
  ) {
    const title = translatedWidgetText(
      widget.config.title,
      copy.defaultTitle,
      trans,
    );

    return (
      <VideoPosterGate
        appearance={appearance}
        config={widget.config}
        playLabel={trans(
          message('Play :title', {
            values: {title},
          }),
        )}
        poster={widget.config.coverImage}
        posterKey={widget.config.url}
        motion={widget.config.playButtonMotion}
        duration={widget.config.duration}
        caption={
          <>
            <WidgetSectionHeader widget={widget} copy={copy} />
            {widget.config.metadataLabel ? (
              <p className="text-xs opacity-65">
                {widget.config.metadataLabel}
              </p>
            ) : null}
          </>
        }
      >
        {isDirectVideo ? (
          <video
            autoPlay
            controls
            className="size-full bg-black object-contain"
            src={widget.config.url}
          />
        ) : (
          <iframe
            title={title}
            src={widget.config.url}
            className="size-full border-0 bg-black"
            loading="eager"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </VideoPosterGate>
    );
  }

  if (isVideo && videoPresentation === 'featured') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="overflow-hidden p-0"
      >
        <a
          href={href ?? widget.config.url}
          target="_blank"
          rel="noreferrer"
          className="group block text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {widget.config.coverImage ? (
            <div className="relative aspect-video overflow-hidden bg-black">
              <img
                src={widget.config.coverImage}
                alt=""
                className="size-full object-cover opacity-90 transition-transform duration-200 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-12 place-items-center rounded-full bg-black/70 text-white">
                  <PlayIcon className="size-5 fill-current" />
                </span>
              </span>
              {widget.config.duration ? (
                <span className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
                  {widget.config.duration}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="p-4 @2xl:p-5">
            <WidgetSectionHeader widget={widget} copy={copy} />
            {widget.config.metadataLabel ? (
              <p className="text-xs opacity-65">
                {widget.config.metadataLabel}
              </p>
            ) : null}
          </div>
        </a>
      </BiolinkWidgetSurface>
    );
  }

  if (isVideo && isDirectVideo && videoPresentation !== 'link') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
        style={itemStyleCss(
          resolveCollectionItemStyle(appearance, widget.config.itemStyle),
        )}
      >
        <WidgetSectionHeader widget={widget} copy={copy} />
        <video
          controls
          className="aspect-video w-full rounded-lg border-0 bg-black"
          src={widget.config.url}
        />
      </BiolinkWidgetSurface>
    );
  }

  if (canEmbed) {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
      >
        <WidgetSectionHeader widget={widget} copy={copy} />
        <iframe
          title={translatedWidgetText(
            widget.config.title,
            copy.defaultTitle,
            trans,
          )}
          src={widget.config.url}
          className="min-h-80 w-full rounded-lg border-0 bg-transparent"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </BiolinkWidgetSurface>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={copy} />
      {widget.type === 'document' && widget.config.label ? (
        <div className="mb-3 text-sm opacity-80">{widget.config.label}</div>
      ) : null}
      <PublicActionButton
        appearance={appearance}
        icon={<ExternalLinkIcon />}
        title={translatedWidgetText(
          widget.config.buttonLabel,
          copy.defaultButton,
          trans,
        )}
        href={href ?? widget.config.url}
        inSurface
        className="min-h-12 py-2"
      />
    </BiolinkWidgetSurface>
  );
}

export function PollWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const options = widget.items ?? [];

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.poll.defaultTitle}
          />
        </div>
        <div>
          {options.length} <Trans message="options" />
        </div>
      </div>
    );
  }

  return <PublicPollForm widget={widget} appearance={appearance} />;
}

function PublicPollForm({
  widget,
  appearance,
}: {
  widget: ConfigurableWidget;
  appearance?: BiolinkAppearanceConfig | null;
}) {
  const {trans} = useTrans();
  const options = (widget.items ?? []).filter(item => item.active);
  const [selectedOption, setSelectedOption] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [pollResult, setPollResult] = useState<PublicPollResult | null>(null);
  const [open, setOpen] = useState(false);
  const title = translatedWidgetText(
    widget.config.title,
    widgetCopy.poll.defaultTitle,
    trans,
  );
  const question = widget.config.question || widget.config.description;
  const showHeading = shouldShowBiolinkSectionHeading(widget.config.section);

  if (!options.length) {
    return null;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('loading');

    try {
      const response = await apiClient.post<PublicPollSubmissionResponse>(
        `public/biolink/${widget.biolink_id}/widget/${widget.id}/submission`,
        {
          consent,
          payload: {option: selectedOption},
        },
      );
      setPollResult(response.data.poll_results ?? null);
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <PublicActionButton
        appearance={appearance}
        icon={<VoteIcon />}
        title={showHeading ? title : null}
        description={showHeading ? question : null}
        onClick={() => setOpen(true)}
      />
      <Dialog.Root
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedOption('');
            setConsent(false);
            setPollResult(null);
            setState('idle');
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="bg-black/75" />
          <Dialog.Content className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-background p-0 text-foreground shadow-2xl @2xl:max-w-md">
            <Dialog.Header className="border-b px-6 py-5 pe-14 text-center">
              <Dialog.Title className="justify-center text-base">
                {title}
              </Dialog.Title>
              {question ? (
                <Dialog.Description className="text-center">
                  {question}
                </Dialog.Description>
              ) : null}
            </Dialog.Header>
            {state === 'success' ? (
              <>
                <Dialog.Body className="mx-0 max-h-[min(64vh,520px)] space-y-5 overflow-y-auto px-6 py-6 text-center">
                  <div className="rounded-lg bg-positive/10 p-4 text-sm text-positive">
                    {widget.config.successMessage ||
                      (widgetCopy.poll.defaultSuccess ? (
                        <Trans {...widgetCopy.poll.defaultSuccess} />
                      ) : null)}
                  </div>
                  {widget.config.showResults !== false && pollResult ? (
                    <PublicPollResults
                      result={pollResult}
                      appearance={appearance}
                    />
                  ) : widget.config.showResults !== false ? (
                    <div className="text-sm text-muted-foreground">
                      <Trans message="Your vote" />: {selectedOption}
                    </div>
                  ) : null}
                </Dialog.Body>
                <div className="border-t bg-muted/40 px-6 py-4">
                  <PublicSubmitButton
                    appearance={appearance}
                    type="button"
                    onClick={() => setOpen(false)}
                    label={<Trans message="Done" />}
                  />
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                <Dialog.Body className="mx-0 max-h-[min(64vh,520px)] space-y-3 px-6 py-5">
                  <div className="space-y-2">
                    {options.map(item => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-input px-3 py-2 text-sm"
                      >
                        <input
                          required
                          type="radio"
                          name={`poll-${widget.id}`}
                          value={item.title ?? ''}
                          checked={selectedOption === item.title}
                          onChange={() => setSelectedOption(item.title ?? '')}
                        />
                        <span>{item.title}</span>
                      </label>
                    ))}
                  </div>
                  <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <Checkbox
                      bindToHookForm={false}
                      checked={consent}
                      onCheckedChange={checked => setConsent(!!checked)}
                      required
                    />
                    <span>
                      {widget.config.consentText ? (
                        widget.config.consentText
                      ) : (
                        <Trans message="I agree to share this information with the page owner." />
                      )}
                    </span>
                  </label>
                  <PublicFormLegalNotice />
                  {state === 'error' ? (
                    <div className="text-sm text-destructive">
                      <Trans message="Could not submit this form. Please check the fields and try again." />
                    </div>
                  ) : null}
                </Dialog.Body>
                <div className="border-t bg-muted/40 px-6 py-4">
                  <PublicSubmitButton
                    appearance={appearance}
                    disabled={state === 'loading'}
                    label={
                      widget.config.buttonLabel ||
                      (widgetCopy.poll.defaultButton ? (
                        <Trans {...widgetCopy.poll.defaultButton} />
                      ) : null)
                    }
                  />
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function PublicPollResults({
  result,
  appearance,
}: {
  result: PublicPollResult;
  appearance?: BiolinkAppearanceConfig | null;
}) {
  const barColor = appearance?.btnConfig?.color;

  return (
    <section className="text-left">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-semibold">
          <Trans message="Poll results" />
        </h3>
        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
          {result.total_votes} <Trans message="votes" />
        </span>
      </div>
      <div className="space-y-3">
        {result.options.map(option => (
          <div key={option.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{option.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {option.votes} · {option.percentage}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                role="progressbar"
                aria-label={option.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={option.percentage}
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${option.percentage}%`,
                  backgroundColor: barColor || undefined,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const discordPresenceStatus = {
  online: {label: 'Online', color: 'bg-emerald-400'},
  idle: {label: 'Idle', color: 'bg-amber-400'},
  dnd: {label: 'Do not disturb', color: 'bg-rose-400'},
  offline: {label: 'Offline', color: 'bg-current/35'},
} as const;

type PublicDiscordPresence = {
  available: boolean;
  username?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  activity?: string | null;
};

type PublicSteamProfile = {
  available: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  gameName?: string | null;
  profileUrl?: string | null;
};

function usePublicProfileData<T extends {available: boolean}>({
  biolinkId,
  widgetId,
  endpoint,
  enabled,
  interval,
}: {
  biolinkId?: number;
  widgetId?: number;
  endpoint: 'discord-presence' | 'steam-profile';
  enabled: boolean;
  interval: number;
}) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!enabled || !biolinkId || !widgetId) {
      setData(null);
      return;
    }

    let cancelled = false;
    const update = async () => {
      try {
        const response = await fetch(
          `/api/v1/public/biolink/${biolinkId}/widget/${widgetId}/${endpoint}`,
          {headers: {Accept: 'application/json'}, cache: 'no-store'},
        );
        if (!response.ok) return;
        const result = (await response.json()) as T;
        if (!cancelled) {
          setData(result);
        }
      } catch {
        // Public profile data is optional; manual values remain visible.
      }
    };

    void update();
    const timer = window.setInterval(update, interval);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [biolinkId, enabled, endpoint, interval, widgetId]);

  return data;
}

function getDiscordPresenceStatus(status?: string | null) {
  return discordPresenceStatus[
    status === 'online' || status === 'idle' || status === 'dnd'
      ? status
      : 'offline'
  ];
}

function steamStatusLabel(status?: string | null): string | null {
  const labels: Record<string, string> = {
    online: 'Online',
    'in-game': 'In game',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
    snooze: 'Snooze',
    'looking to trade': 'Looking to trade',
    'looking to play': 'Looking to play',
  };

  return status ? (labels[status.toLowerCase()] ?? null) : null;
}

export function DiscordPresenceWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
  biolink,
  isPreview,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const livePresence = usePublicProfileData<PublicDiscordPresence>({
    biolinkId: biolink?.id,
    widgetId: widget.id,
    endpoint: 'discord-presence',
    enabled:
      variant === 'biolinkPage' &&
      !isPreview &&
      widget.config.discordSource === 'lanyard',
    interval: 30_000,
  });
  const liveProfile = livePresence?.available ? livePresence : null;
  const status = getDiscordPresenceStatus(
    liveProfile?.status ?? widget.config.discordStatus,
  );
  const username =
    liveProfile?.username || widget.config.discordUsername || 'Discord';
  const activity = liveProfile?.activity ?? widget.config.discordActivity;

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.discordPresence.defaultTitle}
          />
        </div>
        <div>{username}</div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} config={widget.config}>
      <WidgetSectionHeader widget={widget} copy={widgetCopy.discordPresence} />
      <div className="border-t border-current/15 pt-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn('size-2.5 shrink-0 rounded-full', status.color)}
            aria-hidden
          />
          {liveProfile?.avatarUrl ? (
            <img
              src={liveProfile.avatarUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <strong className="min-w-0 wrap-break-word">{username}</strong>
              <span className="text-xs font-medium opacity-75">
                <Trans message={status.label} />
              </span>
            </div>
            {activity ? (
              <p className="mt-1 text-sm leading-5 text-pretty opacity-80">
                {activity}
              </p>
            ) : null}
          </div>
        </div>
        {widget.config.discordUrl ? (
          <PublicActionButton
            appearance={appearance}
            href={widget.config.discordUrl}
            icon={<ExternalLinkIcon />}
            title={translatedWidgetText(
              widget.config.buttonLabel,
              widgetCopy.discordPresence.defaultButton,
              trans,
            )}
            inSurface
            className="mt-3 min-h-12 py-2"
          />
        ) : null}
      </div>
    </BiolinkWidgetSurface>
  );
}

export function GamingProfileWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
  biolink,
  isPreview,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const liveSteam = usePublicProfileData<PublicSteamProfile>({
    biolinkId: biolink?.id,
    widgetId: widget.id,
    endpoint: 'steam-profile',
    enabled:
      variant === 'biolinkPage' &&
      !isPreview &&
      widget.config.gamingSource === 'steam',
    interval: 60_000,
  });
  const liveProfile = liveSteam?.available ? liveSteam : null;
  const gamerTag =
    liveProfile?.displayName || widget.config.gamerTag || 'Gamer';
  const gamingUrl = liveProfile?.profileUrl || widget.config.gamingUrl;
  const details = [
    {label: 'Status', value: steamStatusLabel(liveProfile?.status)},
    {
      label: 'Playing',
      value: liveProfile?.gameName ?? widget.config.currentGame,
    },
    {label: 'Platform', value: widget.config.platform},
    {label: 'Rank', value: widget.config.rank},
  ].filter((detail): detail is {label: string; value: string} =>
    Boolean(detail.value),
  );

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          <WidgetDefaultText
            value={widget.config.title}
            fallback={widgetCopy.gamingProfile.defaultTitle}
          />
        </div>
        <div>{gamerTag}</div>
      </div>
    );
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} config={widget.config}>
      <WidgetSectionHeader widget={widget} copy={widgetCopy.gamingProfile} />
      <div className="border-t border-current/15 pt-3">
        {liveProfile?.avatarUrl ? (
          <img
            src={liveProfile.avatarUrl}
            alt=""
            className="mb-3 size-12 rounded-full object-cover"
          />
        ) : null}
        <div className="text-xs font-medium opacity-70">
          <Trans message="Gamertag" />
        </div>
        <div className="mt-1 text-lg leading-6 font-semibold wrap-break-word">
          {gamerTag}
        </div>
        {details.length ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {details.map(detail => (
              <div key={detail.label} className="min-w-0">
                <dt className="text-xs font-medium opacity-70">
                  <Trans message={detail.label} />
                </dt>
                <dd className="mt-0.5 wrap-break-word">{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {gamingUrl ? (
          <PublicActionButton
            appearance={appearance}
            href={gamingUrl}
            icon={<ExternalLinkIcon />}
            title={translatedWidgetText(
              widget.config.buttonLabel,
              widgetCopy.gamingProfile.defaultButton,
              trans,
            )}
            inSurface
            className="mt-3 min-h-12 py-2"
          />
        ) : null}
      </div>
    </BiolinkWidgetSurface>
  );
}

export function ReviewsWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const items = widget.items ?? [];
  const layoutInfo = collectionLayoutClasses(widget.config.layout);

  if (variant === 'editor') {
    return (
      <GenericEditorSummary
        widget={widget}
        copy={widgetCopy.reviews}
        countLabel={<Trans message="reviews" />}
      />
    );
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} config={widget.config}>
      <WidgetSectionHeader widget={widget} copy={widgetCopy.reviews} />
      <CollectionItems layout={layoutInfo.layout}>
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              layoutInfo.item,
              'biolink-surface-item rounded-lg border p-4',
            )}
            style={itemStyleCss(
              resolveCollectionItemStyle(appearance, widget.config.itemStyle),
            )}
          >
            <div className="flex items-start gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <div className="grid size-12 place-items-center rounded-full bg-current/10">
                  <StarIcon className="size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{item.title}</div>
                {item.description ? (
                  <div className="mt-1 text-sm opacity-80">
                    {item.description}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );
}

export function StatsWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = propsWidget as ConfigurableWidget;
  const items = widget.items ?? [];
  const layoutInfo = collectionLayoutClasses(widget.config.layout);

  if (variant === 'editor') {
    return (
      <GenericEditorSummary
        widget={widget}
        copy={widgetCopy.stats}
        countLabel={<Trans message="stats" />}
      />
    );
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} config={widget.config}>
      <WidgetSectionHeader widget={widget} copy={widgetCopy.stats} />
      <CollectionItems layout={layoutInfo.layout}>
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              layoutInfo.item,
              'biolink-surface-item rounded-lg border p-3 text-center',
            )}
            style={itemStyleCss(
              resolveCollectionItemStyle(appearance, widget.config.itemStyle),
            )}
          >
            <div className="text-lg font-semibold">{item.description}</div>
            <div className="mt-1 text-xs opacity-75">{item.title}</div>
          </div>
        ))}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );
}

export function GenericListWidgetRenderer({
  widget: propsWidget,
  variant,
  appearance,
  biolink,
}: WidgetRendererProps) {
  const {trans} = useTrans();
  const widget = propsWidget as ConfigurableWidget;
  const copy = widgetCopy[widget.type];
  const items = widget.items ?? [];
  const layoutInfo = collectionLayoutClasses(widget.config.layout);

  if (variant === 'editor') {
    return (
      <GenericEditorSummary
        widget={widget}
        copy={copy}
        countLabel={<Trans message="items" />}
      />
    );
  }

  if (widget.type === 'eventList') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
      >
        <WidgetSectionHeader widget={widget} copy={copy} />
        <div
          className={cn(
            'flex flex-col gap-2.5',
            widget.config.layout === 'timeline' &&
              'relative before:absolute before:top-5 before:bottom-5 before:left-[1.1rem] before:w-px before:bg-current/20',
          )}
        >
          {items.map(item => (
            <EventListCard
              key={item.id}
              item={item}
              buttonLabel={translatedWidgetText(
                widget.config.buttonLabel,
                copy.defaultButton,
                trans,
              )}
              utm={widget.utm}
              itemStyle={resolveCollectionItemStyle(
                appearance,
                widget.config.itemStyle,
              )}
              timeline={widget.config.layout === 'timeline'}
            />
          ))}
        </div>
      </BiolinkWidgetSurface>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <WidgetSectionHeader widget={widget} copy={copy} />
      <CollectionItems layout={layoutInfo.layout}>
        {items.map(item => (
          <a
            key={item.id}
            href={applyUtmToUrl(item.url, widget.utm)}
            target="_blank"
            rel="noreferrer"
            className={cn(
              layoutInfo.item,
              'biolink-surface-item flex min-h-14 items-center gap-3 rounded-lg border p-3 text-inherit no-underline transition hover:scale-[1.01]',
            )}
            style={itemStyleCss(
              resolveCollectionItemStyle(appearance, widget.config.itemStyle),
            )}
          >
            {item.image ? (
              <ResilientContentImage
                src={item.image}
                seedParts={[biolink?.id, widget.id, item.id]}
                alt=""
                className="size-12 shrink-0 rounded-md object-cover"
                showPlaceholder={false}
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-current/10 [&_svg]:size-5">
                {copy.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{item.title}</span>
              {item.description ? (
                <span className="mt-0.5 line-clamp-2 block text-sm opacity-75">
                  {item.description}
                </span>
              ) : null}
            </span>
            <span className="text-sm font-semibold">
              {widget.config.buttonLabel ||
                (copy.defaultButton ? <Trans {...copy.defaultButton} /> : null)}
            </span>
          </a>
        ))}
      </CollectionItems>
    </BiolinkWidgetSurface>
  );
}

function downloadContactVcard(config: WidgetConfig): void {
  const escape = (value?: string) =>
    (value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(config.name || config.title || 'Contact')}`,
    config.occupation ? `TITLE:${escape(config.occupation)}` : '',
    config.email ? `EMAIL;TYPE=INTERNET:${escape(config.email)}` : '',
    config.phone ? `TEL;TYPE=CELL:${escape(config.phone)}` : '',
    config.whatsapp ? `TEL;TYPE=CELL,VOICE:${escape(config.whatsapp)}` : '',
    config.address ? `ADR;TYPE=WORK:;;${escape(config.address)};;;;` : '',
    config.url ? `URL:${escape(config.url)}` : '',
    'END:VCARD',
  ].filter(Boolean);
  const blob = new Blob([`${lines.join('\r\n')}\r\n`], {
    type: 'text/vcard;charset=utf-8',
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${(config.name || 'contact').replace(/[^a-z0-9_-]+/gi, '-')}.vcf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function EventListCard({
  item,
  buttonLabel,
  utm,
  itemStyle,
  timeline = false,
}: {
  item: BiolinkWidgetItem;
  buttonLabel?: string;
  utm?: string | null;
  itemStyle?: CollectionItemStyle;
  timeline?: boolean;
}) {
  const href = applyUtmToUrl(item.url, utm);

  return (
    <a
      href={href || undefined}
      target={href ? '_blank' : undefined}
      rel={href ? 'noreferrer' : undefined}
      className={cn(
        'biolink-product-card biolink-surface-item grid min-h-20 w-full min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3.5 text-inherit no-underline outline-none focus-visible:ring',
        timeline && 'relative border-0 bg-transparent p-0 py-2',
      )}
      style={itemStyleCss(itemStyle)}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-current/10">
        <CalendarDaysIcon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <strong className="block leading-5 wrap-break-word">
          {item.title}
        </strong>
        {item.description ? (
          <span className="mt-1 line-clamp-2 block text-sm leading-5 opacity-80">
            {item.description}
          </span>
        ) : null}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium opacity-80">
        <span className="hidden @2xl:inline">{buttonLabel}</span>
        <ArrowRightIcon className="size-4" />
      </span>
    </a>
  );
}

function GenericEditorSummary({
  widget,
  copy,
  countLabel,
}: {
  widget: ConfigurableWidget;
  copy: (typeof widgetCopy)[NewWidgetType];
  countLabel: ReactNode;
}) {
  return (
    <div className="text-sm text-muted-foreground">
      <div>
        <WidgetDefaultText
          value={widget.config.title}
          fallback={copy.defaultTitle}
        />
      </div>
      <div>
        {widget.items?.length ?? 0} {countLabel}
      </div>
    </div>
  );
}

function WidgetSectionHeader({
  widget,
  copy,
  mutedColor,
}: {
  widget: ConfigurableWidget;
  copy: (typeof widgetCopy)[NewWidgetType];
  mutedColor?: string;
}) {
  const section = widget.config.section;
  const showHeading = shouldShowBiolinkSectionHeading(section);

  if (!showHeading && !section?.actionUrl) {
    return null;
  }

  return (
    <div className="mb-4 flex min-w-0 items-start gap-3 text-left">
      {showHeading ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-current/10">
          <span className="flex size-5 shrink-0 items-center justify-center opacity-80 *:size-5">
            {copy.icon}
          </span>
        </div>
      ) : null}
      <div className="min-w-0 flex-1 pt-0.5">
        {showHeading ? (
          <div className="text-base leading-5 font-semibold text-balance wrap-break-word">
            <WidgetDefaultText
              value={widget.config.title}
              fallback={copy.defaultTitle}
            />
          </div>
        ) : null}
        {showHeading && widget.config.description ? (
          <div
            className={cn(
              'text-sm leading-5 text-pretty wrap-break-word',
              'mt-1',
              !mutedColor && 'opacity-80',
            )}
            style={{color: mutedColor}}
          >
            {widget.config.description}
          </div>
        ) : null}
      </div>
      {section?.actionUrl ? (
        <a
          href={section.actionUrl}
          target={section.actionUrl.startsWith('http') ? '_blank' : undefined}
          rel={section.actionUrl.startsWith('http') ? 'noreferrer' : undefined}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {section.actionLabel || <Trans message="View all" />}
          <ArrowRightIcon className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

function getOfferBoxTextTone(textColor?: string): {
  mutedColor?: string;
  linkColor?: string;
} {
  if (!textColor) {
    return {};
  }

  return {
    mutedColor: toneColor(textColor, 0.3),
    linkColor: toneColor(textColor, 0.18),
  };
}

type Rgb = {r: number; g: number; b: number};

function toneColor(color: string, amount: number): string {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return color;
  }

  return rgbToCss(mixRgb(rgb, luminance(rgb) > 0.55 ? black : white, amount));
}

function parseHexColor(color: string): Rgb | null {
  const short = /^#([0-9a-f]{3})$/i.exec(color.trim());
  const full = /^#([0-9a-f]{6})$/i.exec(color.trim());

  if (short) {
    const [r, g, b] = short[1].split('').map(part => parseInt(part + part, 16));
    return {r, g, b};
  }

  if (full) {
    const hex = full[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
}

const white: Rgb = {r: 255, g: 255, b: 255};
const black: Rgb = {r: 0, g: 0, b: 0};

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function rgbToCss({r, g, b}: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}

function luminance({r, g, b}: Rgb): number {
  return [r, g, b]
    .map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    })
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}

function normalizeItemsForForm(
  items: Array<BiolinkWidgetItem | ItemFormValue> | undefined,
  allowEmpty = false,
): ItemFormValue[] {
  if (!items?.length) {
    return allowEmpty ? [] : [emptyItem()];
  }

  return items.map(item => ({
    title: item.title ?? '',
    description: item.description ?? '',
    url: item.url ?? '',
    image: item.image ?? '',
    price: item.price ?? '',
    currency: item.currency ?? 'USD',
    active: String(item.active) !== '0' && String(item.active) !== 'false',
    type: item.type ?? undefined,
    payload: item.payload ?? {},
  }));
}

function initialPresetItems(
  type: ItemWidgetType,
  initialConfig?: Record<string, unknown>,
): ItemFormValue[] | undefined {
  if (type !== 'embedCollection') return undefined;
  const provider = initialConfig?.presetProvider;
  if (typeof provider !== 'string') return undefined;

  return [
    {
      type: 'embed',
      title: '',
      description: '',
      url: '',
      image: '',
      price: '',
      currency: 'USD',
      active: true,
      payload: {provider},
    },
  ];
}

function emptyItem(): ItemFormValue {
  return {
    title: '',
    description: '',
    url: '',
    image: '',
    price: '',
    currency: 'USD',
    active: true,
    payload: {},
  };
}

function defaultItemType(type: NewWidgetType): string {
  return (
    (
      {
        linkedProduct: 'product',
        linkedCourse: 'course',
        service: 'service',
        faq: 'faq',
        linkCollection: 'link',
        embedCollection: 'embed',
        imageGallery: 'image',
        poll: 'pollOption',
        reviews: 'review',
        stats: 'stat',
        podcastMusic: 'musicLink',
        mobileApp: 'appLink',
        eventList: 'event',
        donation: 'donationLink',
      } as Partial<Record<NewWidgetType, string>>
    )[type] ?? 'item'
  );
}

function normalizeCaptureConfig(
  type: Extract<
    NewWidgetType,
    'contactForm' | 'emailSignup' | 'eventRsvp' | 'smsSignup'
  >,
  config: WidgetConfig,
): WidgetConfig {
  const keys: (keyof WidgetConfig)[] =
    type === 'eventRsvp'
      ? [
          'title',
          'description',
          'buttonLabel',
          'successMessage',
          'consentText',
          'eventDate',
          'allowWaitlist',
          'contactMode',
          'allowGuests',
          'maxGuests',
        ]
      : type === 'contactForm'
        ? [
            'title',
            'description',
            'buttonLabel',
            'successMessage',
            'consentText',
            'requirePhone',
            'contactMode',
          ]
        : type === 'smsSignup'
          ? [
              'title',
              'description',
              'buttonLabel',
              'successMessage',
              'consentText',
              'campaign',
              'presentation',
            ]
          : [
              'title',
              'description',
              'buttonLabel',
              'successMessage',
              'consentText',
              'campaign',
              'presentation',
            ];

  return pickConfig(config, keys);
}

function normalizeItemWidgetConfig(
  type: ItemWidgetType,
  config: WidgetConfig,
): WidgetConfig {
  return pickConfig(config, itemWidgetConfigKeys[type]);
}

function normalizeSimpleConfig(
  type: (typeof simpleWidgetTypes)[number],
  config: WidgetConfig,
): WidgetConfig {
  const keys: Record<
    (typeof simpleWidgetTypes)[number],
    (keyof WidgetConfig)[]
  > = {
    qrCode: ['title', 'description', 'value', 'label', 'qrDisplay'],
    location: [
      'title',
      'description',
      'address',
      'url',
      'buttonLabel',
      'mapDisplay',
      'mapProvider',
      'cep',
      'street',
      'number',
      'complement',
      'neighborhood',
      'city',
      'state',
      'latitude',
      'longitude',
    ],
    contactCard: [
      'title',
      'description',
      'name',
      'occupation',
      'email',
      'phone',
      'whatsapp',
      'address',
      'hours',
      'url',
      'buttonLabel',
      'presentation',
      'enableVcard',
    ],
    discountCode: [
      'title',
      'description',
      'code',
      'buttonLabel',
      'expiresAt',
      'url',
    ],
    document: [
      'title',
      'description',
      'url',
      'buttonLabel',
      'label',
      'documentKind',
    ],
    genericVideo: [
      'title',
      'description',
      'url',
      'buttonLabel',
      'embedMode',
      'presentation',
      'coverImage',
      'duration',
      'metadataLabel',
      'playBehavior',
      'playButtonMotion',
    ],
    externalForm: ['title', 'description', 'url', 'buttonLabel', 'embedMode'],
    rssFeed: ['title', 'description', 'url', 'buttonLabel'],
    discordPresence: [
      'title',
      'description',
      'discordSource',
      'discordUserId',
      'discordUsername',
      'discordStatus',
      'discordActivity',
      'discordUrl',
      'buttonLabel',
    ],
    gamingProfile: [
      'title',
      'description',
      'gamingSource',
      'steamProfileUrl',
      'gamerTag',
      'currentGame',
      'platform',
      'rank',
      'gamingUrl',
      'buttonLabel',
    ],
  };

  const normalized = pickConfig(config, keys[type]);

  if (type === 'location') {
    normalized.address = buildFormattedAddress(config) || config.address;
  }

  return normalized;
}

function pickConfig(
  config: WidgetConfig,
  keys: (keyof WidgetConfig)[],
): WidgetConfig {
  return [...new Set([...keys, 'section', 'blueprintKey'] as const)].reduce(
    (result, key) => {
      const value = config[key];
      if (value !== undefined) {
        result[key] = value as never;
      }
      return result;
    },
    {} as WidgetConfig,
  );
}

function formatPrice(
  price: string | number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (price === null || price === undefined || price === '') {
    return null;
  }

  const amount = Number(price);
  if (Number.isNaN(amount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount.toFixed(2)}`.trim();
  }
}

function applyUtmToUrl(
  url: string | null | undefined,
  utm: string | null | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }

  if (!utm) {
    return url;
  }

  try {
    const nextUrl = new URL(url);
    new URLSearchParams(utm).forEach((value, key) => {
      nextUrl.searchParams.set(key, value);
    });
    return nextUrl.toString();
  } catch {
    return url;
  }
}

function isDirectVideoUrl(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function canIframeUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (
      (host === 'rumble.com' || host.endsWith('.rumble.com')) &&
      parsed.pathname.startsWith('/embed/')
    ) {
      return true;
    }
    if (
      (host === 'vk.com' || host.endsWith('.vk.com')) &&
      parsed.pathname === '/video_ext.php'
    ) {
      return true;
    }
    return [
      'typeform.com',
      'tally.so',
      'docs.google.com',
      'gleam.io',
      'youtube.com',
      'youtube-nocookie.com',
      'vimeo.com',
      'player.vimeo.com',
    ].some(allowed => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

function buildFormattedAddress(config: WidgetConfig): string {
  const parts: string[] = [];
  if (config.street) {
    let line = config.street;
    if (config.number) line += `, ${config.number}`;
    if (config.complement) line += ` - ${config.complement}`;
    parts.push(line);
  }
  if (config.neighborhood) parts.push(config.neighborhood);
  if (config.city && config.state) {
    parts.push(`${config.city} - ${config.state}`);
  } else if (config.city) {
    parts.push(config.city);
  } else if (config.state) {
    parts.push(config.state);
  }
  if (config.cep) parts.push(config.cep);
  return parts.join(', ');
}

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

type DeprecatedGeocodeResult = {
  lat: string;
  lon: string;
};

async function geocodeAddress(
  _address: string,
): Promise<DeprecatedGeocodeResult | null> {
  void _address;
  // Kept only for the unreachable legacy form below. Public Nominatim must not
  // be exposed as a generic geocoder in a no-code product.
  return null;
}

async function fetchViaCep(cep: string): Promise<ViaCepResponse | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// oxlint-disable-next-line no-unused-vars
function DeprecatedLocationBasicsFields({
  form,
}: {
  form: UseFormReturn<SimpleConfigWidgetFormValue>;
}) {
  const {trans} = useTrans();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  const handleCepSearch = async () => {
    const cep = form.getValues('cep') ?? '';
    setCepError('');
    setCepLoading(true);
    const data = await fetchViaCep(cep);
    setCepLoading(false);
    if (!data) {
      setCepError(
        trans(message('Postal code not found. Enter the address manually.')),
      );
      return;
    }
    form.setValue('street', data.logradouro ?? '', {shouldDirty: true});
    form.setValue('neighborhood', data.bairro ?? '', {shouldDirty: true});
    form.setValue('city', data.localidade ?? '', {shouldDirty: true});
    form.setValue('state', data.uf ?? '', {shouldDirty: true});
    form.setValue('cep', data.cep ?? cep, {shouldDirty: true});

    // Auto-geocode after filling address
    const fullAddress = [
      data.logradouro,
      form.getValues('number'),
      data.bairro,
      data.localidade,
      data.uf,
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');

    setGeoLoading(true);
    setGeoStatus(trans(message('Locating the address on the map...')));
    const geo = await geocodeAddress(fullAddress);
    setGeoLoading(false);
    if (geo) {
      form.setValue('latitude', geo.lat, {shouldDirty: true});
      form.setValue('longitude', geo.lon, {shouldDirty: true});
      // Auto-generate Google Maps URL
      form.setValue(
        'url',
        `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lon}`,
        {shouldDirty: true},
      );
      // Auto-generate address string for backward compat
      const addr = [
        data.logradouro,
        form.getValues('number'),
        data.bairro,
        data.localidade ? `${data.localidade} - ${data.uf}` : data.uf,
        data.cep,
      ]
        .filter(Boolean)
        .join(', ');
      form.setValue('address', addr, {shouldDirty: true});
      setGeoStatus(trans(message('Location found.')));
    } else {
      setGeoStatus(
        trans(message('Could not locate it. Enter the address manually.')),
      );
    }
  };

  const handleManualGeocode = async () => {
    const fullAddress = [
      form.getValues('street'),
      form.getValues('number'),
      form.getValues('neighborhood'),
      form.getValues('city'),
      form.getValues('state'),
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');

    setGeoLoading(true);
    setGeoStatus(trans(message('Locating the address on the map...')));
    const geo = await geocodeAddress(fullAddress);
    setGeoLoading(false);
    if (geo) {
      form.setValue('latitude', geo.lat, {shouldDirty: true});
      form.setValue('longitude', geo.lon, {shouldDirty: true});
      form.setValue(
        'url',
        `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lon}`,
        {shouldDirty: true},
      );
      form.setValue('address', fullAddress.replace(', Brasil', ''), {
        shouldDirty: true,
      });
      setGeoStatus(trans(message('Location found.')));
    } else {
      setGeoStatus(trans(message('Could not locate the address.')));
    }
  };

  const lat = form.watch('latitude');
  const lng = form.watch('longitude');
  const hasCoords = !!lat && !!lng;

  return (
    <>
      {/* CEP Search */}
      <div className="flex gap-2">
        <HookForm.Field name="cep" className="flex-1">
          <Field.Label>
            <Trans message="Postal code (CEP)" />
          </Field.Label>
          <Input
            placeholder="00000-000"
            maxLength={9}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCepSearch();
              }
            }}
          />
          <Field.Error />
        </HookForm.Field>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-0.5 h-9"
            disabled={cepLoading}
            onClick={handleCepSearch}
          >
            {cepLoading ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SearchIcon className="size-4" />
            )}
            <Trans message="Search address" />
          </Button>
        </div>
      </div>
      {cepError ? (
        <div className="-mt-2 text-xs text-destructive">{cepError}</div>
      ) : null}

      {/* Street + Number */}
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <HookForm.Field name="street">
          <Field.Label>
            <Trans message="Street" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="number">
          <Field.Label>
            <Trans message="Number" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </div>

      {/* Complement */}
      <HookForm.Field name="complement">
        <Field.Label>
          <Trans message="Complement (optional)" />
        </Field.Label>
        <Input />
        <Field.Error />
      </HookForm.Field>

      {/* Neighborhood + City + State */}
      <div className="grid gap-4 sm:grid-cols-3">
        <HookForm.Field name="neighborhood">
          <Field.Label>
            <Trans message="Neighborhood" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="city">
          <Field.Label>
            <Trans message="City" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="state">
          <Field.Label>
            <Trans message="State (UF)" />
          </Field.Label>
          <Input maxLength={2} />
          <Field.Error />
        </HookForm.Field>
      </div>

      {/* Geocode button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={geoLoading}
          onClick={handleManualGeocode}
        >
          {geoLoading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <MapPinIcon className="size-4" />
          )}
          <Trans message="Locate on map" />
        </Button>
        {geoStatus ? (
          <span className="text-xs text-muted-foreground">{geoStatus}</span>
        ) : null}
      </div>

      {/* Map preview */}
      {hasCoords ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <LeafletMap
            latitude={Number(lat)}
            longitude={Number(lng)}
            address={form.getValues('address') || ''}
            className="h-full w-full"
          />
        </div>
      ) : null}

      {/* Hidden fields for lat/lng */}
      <input type="hidden" {...form.register('latitude')} />
      <input type="hidden" {...form.register('longitude')} />
      <input type="hidden" {...form.register('address')} />
      <input type="hidden" {...form.register('url')} />
    </>
  );
}

function canEmbedMapUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const isGoogleEmbed =
      (host === 'google.com' || host.endsWith('.google.com')) &&
      parsed.pathname.includes('/maps/embed');
    const isOpenStreetMapEmbed =
      (host === 'openstreetmap.org' || host.endsWith('.openstreetmap.org')) &&
      parsed.pathname.includes('/export/embed.html');
    const isWazeEmbed =
      (host === 'waze.com' || host.endsWith('.waze.com')) &&
      parsed.pathname.includes('/iframe');
    const isBingEmbed =
      (host === 'bing.com' || host.endsWith('.bing.com')) &&
      parsed.pathname.includes('/maps/embed');

    return isGoogleEmbed || isOpenStreetMapEmbed || isWazeEmbed || isBingEmbed;
  } catch {
    return false;
  }
}

function whatsappUrl(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

export function validateOfferUrl(value?: string): boolean {
  return !value || urlIsValid(value, {checkForDomain: true});
}
