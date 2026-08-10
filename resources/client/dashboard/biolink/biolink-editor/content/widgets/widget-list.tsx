import {ImageWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/image-widget/image-widget-dialog';
import {BookingWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/booking-widget/booking-widget-dialog';
import {MusicHubWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/music-hub-widget/music-hub-widget';
import {SocialsWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-widget-dialog';
import {SoundcloudWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/soundcloud-widget/soundcloud-widget-dialog';
import {TextWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/text-widget/text-widget-dialog';
import {TiktokWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/tiktok-widget/tiktok-widget-dialog';
import {TwitchWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/twitch-widget/twitch-widget-dialog';
import {VimeoWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/vimeo-widget/vimeo-widget-dialog';
import {YoutubeWidgetDialog} from '@app/dashboard/biolink/biolink-editor/content/widgets/youtube-widget/youtube-widget-dialog';
import {
  ContactFormWidgetDialog,
  ContactCardWidgetDialog,
  DiscountCodeWidgetDialog,
  DiscordPresenceWidgetDialog,
  DocumentWidgetDialog,
  EmbedCollectionWidgetDialog,
  EmailSignupWidgetDialog,
  EventRsvpWidgetDialog,
  EventListWidgetDialog,
  ExternalFormWidgetDialog,
  FaqWidgetDialog,
  GenericVideoWidgetDialog,
  GamingProfileWidgetDialog,
  ImageGalleryWidgetDialog,
  LinkCollectionWidgetDialog,
  LinkedCourseWidgetDialog,
  LinkedProductWidgetDialog,
  LocationWidgetDialog,
  MobileAppWidgetDialog,
  PollWidgetDialog,
  QrCodeWidgetDialog,
  ReviewsWidgetDialog,
  RssFeedWidgetDialog,
  ServiceWidgetDialog,
  SmsSignupWidgetDialog,
  StatsWidgetDialog,
  DonationWidgetDialog,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/new-widgets';
import {
  CtaBannerWidgetDialog,
  LogoCloudWidgetDialog,
  SocialFeedWidgetDialog,
  SpotlightWidgetDialog,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/showcase-widgets/showcase-widgets';
import {type BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {Trans} from '@ui/i18n/trans';
import {type JSXElementConstructor, type ReactNode} from 'react';
import {ViewerCountWidgetDialog} from './viewer-count-widget/viewer-count-widget-dialog';
import {
  AudioWidgetDialog,
  CountdownWidgetDialog,
  ImageComparisonWidgetDialog,
} from './enhanced-widgets/enhanced-widgets';

export type AddContentCategory =
  | 'social'
  | 'media'
  | 'text'
  | 'commerce'
  | 'contact'
  | 'events'
  | 'engagement';

export type AddContentStatus = 'available' | 'hidden' | 'comingSoon';

export interface WidgetListItem {
  name: ReactNode;
  label: string;
  description: ReactNode;
  descriptionText: string;
  image: string;
  dialog: JSXElementConstructor<any>;
  category: AddContentCategory;
  keywords: string[];
  featured?: boolean;
  sortOrder: number;
  status: AddContentStatus;
}

const widgetIcon = (name: string, extension = 'webp') =>
  `/images/icons/meulinkbio/v2/${name}.${extension}`;

export const WidgetList: Record<BiolinkWidget['type'], WidgetListItem> = {
  image: {
    name: <Trans message="Image" />,
    label: 'Image',
    image: widgetIcon('image'),
    description: (
      <Trans message="Upload an image and optionally add a link it will redirect to when clicked." />
    ),
    descriptionText:
      'Upload an image and optionally add a link it will redirect to when clicked.',
    dialog: ImageWidgetDialog,
    category: 'media',
    keywords: [
      'image',
      'photo',
      'picture',
      'visual',
      'media',
      'imagem',
      'foto',
    ],
    featured: true,
    sortOrder: 40,
    status: 'available',
  },
  text: {
    name: <Trans message="Text" />,
    label: 'Text',
    image: widgetIcon('text', 'png'),
    description: (
      <Trans message="Add title and optional description. Can be used as a header for the whole biolink or a group of multiple widgets." />
    ),
    descriptionText:
      'Add title and optional description. Can be used as a header for the whole biolink or a group of multiple widgets.',
    dialog: TextWidgetDialog,
    category: 'text',
    keywords: [
      'text',
      'copy',
      'title',
      'description',
      'bio',
      'texto',
      'titulo',
    ],
    featured: true,
    sortOrder: 30,
    status: 'available',
  },
  socials: {
    name: <Trans message="Social Links" />,
    label: 'Social Links',
    image: widgetIcon('share'),
    description: (
      <Trans message="Add your socials links to display them as icon buttons." />
    ),
    descriptionText: 'Add your socials links to display them as icon buttons.',
    dialog: SocialsWidgetDialog,
    category: 'social',
    keywords: [
      'social',
      'instagram',
      'facebook',
      'x',
      'twitter',
      'whatsapp',
      'threads',
      'reddit',
      'pinterest',
      'snapchat',
      'clubhouse',
      'social links',
      'redes sociais',
    ],
    featured: true,
    sortOrder: 20,
    status: 'available',
  },
  youtube: {
    name: <Trans message="Youtube Video" />,
    label: 'Youtube Video',
    image: widgetIcon('video'),
    description: (
      <Trans message="Paste a YouTube video URL to show it as a video embed in your profile." />
    ),
    descriptionText:
      'Paste a YouTube video URL to show it as a video embed in your profile.',
    dialog: YoutubeWidgetDialog,
    category: 'media',
    keywords: ['youtube', 'video', 'media'],
    featured: true,
    sortOrder: 50,
    status: 'available',
  },
  soundcloud: {
    name: <Trans message="Soundcloud Audio" />,
    label: 'Soundcloud Audio',
    image: widgetIcon('music'),
    description: (
      <Trans message="Paste a SoundCloud URL to show it as a playable song in your profile." />
    ),
    descriptionText:
      'Paste a SoundCloud URL to show it as a playable song in your profile.',
    dialog: SoundcloudWidgetDialog,
    category: 'media',
    keywords: ['soundcloud', 'music', 'audio', 'track', 'musica'],
    sortOrder: 80,
    status: 'available',
  },
  vimeo: {
    name: <Trans message="Vimeo Video" />,
    label: 'Vimeo Video',
    image: widgetIcon('video'),
    description: (
      <Trans message="Paste a vimeo URL to show it as a video embed in your profile." />
    ),
    descriptionText:
      'Paste a vimeo URL to show it as a video embed in your profile.',
    dialog: VimeoWidgetDialog,
    category: 'media',
    keywords: ['vimeo', 'video', 'media'],
    sortOrder: 90,
    status: 'available',
  },
  spotify: {
    name: <Trans message="Music Hub" />,
    label: 'Music Hub',
    image: widgetIcon('music'),
    description: (
      <Trans message="Legacy Spotify content is edited through Music Hub." />
    ),
    descriptionText: 'Legacy Spotify content is edited through Music Hub.',
    dialog: MusicHubWidgetDialog,
    category: 'media',
    keywords: ['spotify', 'music', 'audio', 'playlist', 'album', 'musica'],
    sortOrder: 70,
    status: 'hidden',
  },
  twitch: {
    name: <Trans message="Twitch Embed" />,
    label: 'Twitch Embed',
    image: widgetIcon('video'),
    description: (
      <Trans message="Paste twitch profile or clip url to show it as an embed in your profile." />
    ),
    descriptionText:
      'Paste twitch profile or clip url to show it as an embed in your profile.',
    dialog: TwitchWidgetDialog,
    category: 'media',
    keywords: ['twitch', 'stream', 'video', 'live'],
    sortOrder: 100,
    status: 'available',
  },
  tiktok: {
    name: <Trans message="TikTok Embed" />,
    label: 'TikTok Embed',
    image: widgetIcon('video'),
    description: (
      <Trans message="Paste TikTok video url to show it as an embed in your profile." />
    ),
    descriptionText:
      'Paste TikTok video url to show it as an embed in your profile.',
    dialog: TiktokWidgetDialog,
    category: 'media',
    keywords: ['tiktok', 'video', 'shorts', 'social'],
    featured: true,
    sortOrder: 60,
    status: 'available',
  },
  contactForm: {
    name: <Trans message="Contact form" />,
    label: 'Contact form',
    image: widgetIcon('chat'),
    description: (
      <Trans message="Collect name, email, phone and a message from visitors." />
    ),
    descriptionText: 'Collect name, email, phone and a message from visitors.',
    dialog: ContactFormWidgetDialog,
    category: 'contact',
    keywords: ['contact', 'form', 'message', 'lead', 'contato', 'formulario'],
    featured: true,
    sortOrder: 110,
    status: 'available',
  },
  emailSignup: {
    name: <Trans message="Email signup" />,
    label: 'Email signup',
    image: widgetIcon('newsletter'),
    description: (
      <Trans message="Capture email subscribers with optional name and campaign context." />
    ),
    descriptionText:
      'Capture email subscribers with optional name and campaign context.',
    dialog: EmailSignupWidgetDialog,
    category: 'contact',
    keywords: ['email', 'signup', 'newsletter', 'lead', 'inscricao', 'lista'],
    featured: true,
    sortOrder: 120,
    status: 'available',
  },
  eventRsvp: {
    name: <Trans message="Event RSVP" />,
    label: 'Event RSVP',
    image: widgetIcon('calendar'),
    description: (
      <Trans message="Collect event interest, RSVP or waitlist responses." />
    ),
    descriptionText: 'Collect event interest, RSVP or waitlist responses.',
    dialog: EventRsvpWidgetDialog,
    category: 'events',
    keywords: ['event', 'rsvp', 'waitlist', 'evento', 'lista de espera'],
    sortOrder: 130,
    status: 'available',
  },
  linkedProduct: {
    name: <Trans message="Products" />,
    label: 'Products',
    image: widgetIcon('shopping-bag'),
    description: (
      <Trans message="Show products from your catalog with an image, price and purchase link." />
    ),
    descriptionText:
      'Show products from your catalog with an image, price and purchase link.',
    dialog: LinkedProductWidgetDialog,
    category: 'commerce',
    keywords: [
      'product',
      'shop',
      'store',
      'price',
      'affiliate',
      'digital download',
      'books',
      'shopify',
      'bonfire',
      'fourthwall',
      'amaze',
      'sendowl',
      'produto',
      'loja',
      'afiliado',
      'digital',
      'livro',
    ],
    featured: true,
    sortOrder: 140,
    status: 'available',
  },
  linkedCourse: {
    name: <Trans message="Linked course" />,
    label: 'Linked course',
    image: widgetIcon('webpage'),
    description: (
      <Trans message="Promote a course, class or mentorship with an external enrollment link." />
    ),
    descriptionText:
      'Promote a course, class or mentorship with an external enrollment link.',
    dialog: LinkedCourseWidgetDialog,
    category: 'commerce',
    keywords: [
      'course',
      'class',
      'mentorship',
      'kajabi',
      'curso',
      'aula',
      'mentoria',
    ],
    sortOrder: 150,
    status: 'available',
  },
  service: {
    name: <Trans message="Service / Hire me" />,
    label: 'Service / Hire me',
    image: widgetIcon('audience'),
    description: (
      <Trans message="Promote services, quotes or booking pages through an external link." />
    ),
    descriptionText:
      'Promote services, quotes or booking pages through an external link.',
    dialog: ServiceWidgetDialog,
    category: 'commerce',
    keywords: [
      'service',
      'hire',
      'booking',
      'calendly',
      'coaching',
      'quote',
      'agenda',
      'servico',
      'orcamento',
      'contratar',
    ],
    sortOrder: 160,
    status: 'available',
  },
  booking: {
    name: <Trans message="Booking" />,
    label: 'Booking',
    image: widgetIcon('calendar'),
    description: (
      <Trans message="Let visitors book a service from your page." />
    ),
    descriptionText: 'Let visitors book a service from your page.',
    dialog: BookingWidgetDialog,
    category: 'commerce',
    keywords: [
      'booking',
      'appointment',
      'calendar',
      'agenda',
      'agendamento',
      'reserva',
      'horário',
    ],
    sortOrder: 165,
    status: 'available',
  },
  faq: {
    name: <Trans message="FAQ" />,
    label: 'FAQ',
    image: widgetIcon('chat'),
    description: (
      <Trans message="Answer common questions directly on the page." />
    ),
    descriptionText: 'Answer common questions directly on the page.',
    dialog: FaqWidgetDialog,
    category: 'text',
    keywords: ['faq', 'questions', 'answers', 'perguntas', 'respostas'],
    sortOrder: 170,
    status: 'available',
  },
  linkCollection: {
    name: <Trans message="Link collection" />,
    label: 'Link collection',
    image: widgetIcon('link'),
    description: (
      <Trans message="Group related links into a compact collection." />
    ),
    descriptionText: 'Group related links into a compact collection.',
    dialog: LinkCollectionWidgetDialog,
    category: 'text',
    keywords: [
      'collection',
      'links',
      'group',
      'community',
      'discord',
      'slack',
      'whatsapp group',
      'colecao',
      'lista',
      'comunidade',
      'grupo',
    ],
    sortOrder: 180,
    status: 'available',
  },
  embedCollection: {
    name: <Trans message="Rich embeds" />,
    label: 'Rich embeds',
    image: widgetIcon('integration-puzzle'),
    description: (
      <Trans message="Show rich previews for Instagram, TikTok and any website link." />
    ),
    descriptionText:
      'Show rich previews for Instagram, TikTok and any website link.',
    dialog: EmbedCollectionWidgetDialog,
    category: 'media',
    keywords: [
      'embed',
      'preview',
      'instagram',
      'tiktok',
      'social post',
      'rich link',
      'incorporar',
      'embutir',
      'previa',
      'cartao',
    ],
    featured: true,
    sortOrder: 185,
    status: 'available',
  },
  imageGallery: {
    name: <Trans message="Image gallery" />,
    label: 'Image gallery',
    image: widgetIcon('image'),
    description: <Trans message="Show a grid of images with optional links." />,
    descriptionText: 'Show a grid of images with optional links.',
    dialog: ImageGalleryWidgetDialog,
    category: 'media',
    keywords: ['gallery', 'images', 'photos', 'galeria', 'fotos'],
    sortOrder: 190,
    status: 'available',
  },
  qrCode: {
    name: <Trans message="QR code card" />,
    label: 'QR code card',
    image: widgetIcon('qr-code'),
    description: (
      <Trans message="Display a QR code for any link or text value." />
    ),
    descriptionText: 'Display a QR code for any link or text value.',
    dialog: QrCodeWidgetDialog,
    category: 'text',
    keywords: ['qr', 'code', 'scan', 'codigo'],
    sortOrder: 200,
    status: 'available',
  },
  location: {
    name: <Trans message="Location / Map" />,
    label: 'Location / Map',
    image: widgetIcon('location'),
    description: (
      <Trans message="Show an address and redirect visitors to an external map." />
    ),
    descriptionText:
      'Show an address and redirect visitors to an external map.',
    dialog: LocationWidgetDialog,
    category: 'contact',
    keywords: ['location', 'map', 'address', 'localizacao', 'mapa', 'endereco'],
    sortOrder: 210,
    status: 'available',
  },
  contactCard: {
    name: <Trans message="Contact card" />,
    label: 'Contact card',
    image: widgetIcon('profile-phone'),
    description: (
      <Trans message="Show email, phone, WhatsApp, address, hours and a contact button." />
    ),
    descriptionText:
      'Show email, phone, WhatsApp, address, hours and a contact button.',
    dialog: ContactCardWidgetDialog,
    category: 'contact',
    keywords: ['contact', 'card', 'details', 'phone', 'whatsapp', 'contato'],
    featured: true,
    sortOrder: 220,
    status: 'available',
  },
  smsSignup: {
    name: <Trans message="SMS signup" />,
    label: 'SMS signup',
    image: widgetIcon('chat'),
    description: (
      <Trans message="Capture phone subscribers with optional name and consent." />
    ),
    descriptionText:
      'Capture phone subscribers with optional name and consent.',
    dialog: SmsSignupWidgetDialog,
    category: 'contact',
    keywords: ['sms', 'phone', 'signup', 'lead', 'telefone', 'inscricao'],
    sortOrder: 230,
    status: 'available',
  },
  poll: {
    name: <Trans message="Poll" />,
    label: 'Poll',
    image: widgetIcon('cursor-click'),
    description: (
      <Trans message="Ask a simple question and save visitor votes in the Data tab." />
    ),
    descriptionText:
      'Ask a simple question and save visitor votes in the Data tab.',
    dialog: PollWidgetDialog,
    category: 'engagement',
    keywords: ['poll', 'vote', 'survey', 'enquete', 'voto', 'pesquisa'],
    featured: true,
    sortOrder: 240,
    status: 'available',
  },
  reviews: {
    name: <Trans message="Reviews" />,
    label: 'Reviews',
    image: widgetIcon('star'),
    description: (
      <Trans message="Add manual testimonials or reviews to build trust." />
    ),
    descriptionText: 'Add manual testimonials or reviews to build trust.',
    dialog: ReviewsWidgetDialog,
    category: 'engagement',
    keywords: [
      'reviews',
      'testimonials',
      'rating',
      'depoimentos',
      'avaliacoes',
    ],
    sortOrder: 250,
    status: 'available',
  },
  stats: {
    name: <Trans message="Stats" />,
    label: 'Stats',
    image: widgetIcon('analytics-dashboard'),
    description: (
      <Trans message="Show manual metrics like followers, clients, projects or achievements." />
    ),
    descriptionText:
      'Show manual metrics like followers, clients, projects or achievements.',
    dialog: StatsWidgetDialog,
    category: 'engagement',
    keywords: [
      'stats',
      'metrics',
      'followers',
      'numbers',
      'metricas',
      'numeros',
    ],
    sortOrder: 260,
    status: 'available',
  },
  discountCode: {
    name: <Trans message="Discount code" />,
    label: 'Discount code',
    image: widgetIcon('discount-ticket'),
    description: (
      <Trans message="Show a coupon with a copy button and optional external link." />
    ),
    descriptionText:
      'Show a coupon with a copy button and optional external link.',
    dialog: DiscountCodeWidgetDialog,
    category: 'commerce',
    keywords: ['discount', 'coupon', 'promo', 'cupom', 'desconto'],
    sortOrder: 270,
    status: 'available',
  },
  document: {
    name: <Trans message="Document / PDF" />,
    label: 'Document / PDF',
    image: widgetIcon('webpage'),
    description: (
      <Trans message="Link to an external HTTPS document or PDF without adding new file storage." />
    ),
    descriptionText:
      'Link to an external HTTPS document or PDF without adding new file storage.',
    dialog: DocumentWidgetDialog,
    category: 'text',
    keywords: ['document', 'pdf', 'download', 'arquivo', 'documento'],
    sortOrder: 280,
    status: 'available',
  },
  genericVideo: {
    name: <Trans message="Generic video" />,
    label: 'Generic video',
    image: widgetIcon('video'),
    description: (
      <Trans message="Add a direct video URL or safe allowed embed." />
    ),
    descriptionText: 'Add a direct video URL or safe allowed embed.',
    dialog: GenericVideoWidgetDialog,
    category: 'media',
    keywords: ['video', 'mp4', 'embed', 'media'],
    sortOrder: 290,
    status: 'available',
  },
  podcastMusic: {
    name: <Trans message="Music Hub" />,
    label: 'Music Hub',
    image: widgetIcon('podcast'),
    description: (
      <Trans message="Create release cards from music links with automatic cover, title and listening services." />
    ),
    descriptionText:
      'Create release cards from music links with automatic cover, title and listening services.',
    dialog: MusicHubWidgetDialog,
    category: 'media',
    keywords: [
      'podcast',
      'music',
      'music hub',
      'apple music',
      'audiomack',
      'presave',
      'pre-save',
      'musica',
    ],
    sortOrder: 300,
    status: 'available',
  },
  mobileApp: {
    name: <Trans message="Mobile app" />,
    label: 'Mobile app',
    image: widgetIcon('apps-phone'),
    description: (
      <Trans message="Add App Store, Google Play or direct app download links." />
    ),
    descriptionText: 'Add App Store, Google Play or direct app download links.',
    dialog: MobileAppWidgetDialog,
    category: 'commerce',
    keywords: ['app', 'mobile', 'app store', 'google play', 'aplicativo'],
    sortOrder: 310,
    status: 'available',
  },
  eventList: {
    name: <Trans message="Event list" />,
    label: 'Event list',
    image: widgetIcon('calendar'),
    description: (
      <Trans message="List events with date, place and an external ticket link." />
    ),
    descriptionText:
      'List events with date, place and an external ticket link.',
    dialog: EventListWidgetDialog,
    category: 'events',
    keywords: ['events', 'tour', 'tickets', 'bandsintown', 'eventos', 'agenda'],
    sortOrder: 320,
    status: 'available',
  },
  externalForm: {
    name: <Trans message="External form" />,
    label: 'External form',
    image: widgetIcon('webpage'),
    description: (
      <Trans message="Redirect to Typeform, Google Forms, Gleam or another safe external form." />
    ),
    descriptionText:
      'Redirect to Typeform, Google Forms, Gleam or another safe external form.',
    dialog: ExternalFormWidgetDialog,
    category: 'contact',
    keywords: ['typeform', 'google forms', 'gleam', 'form', 'formulario'],
    sortOrder: 330,
    status: 'available',
  },
  rssFeed: {
    name: <Trans message="RSS feed" />,
    label: 'RSS feed',
    image: widgetIcon('network'),
    description: (
      <Trans message="Add a public RSS link as a fallback-friendly feed card." />
    ),
    descriptionText: 'Add a public RSS link as a fallback-friendly feed card.',
    dialog: RssFeedWidgetDialog,
    category: 'text',
    keywords: ['rss', 'feed', 'blog', 'posts', 'noticias'],
    sortOrder: 340,
    status: 'available',
  },
  donation: {
    name: <Trans message="Donation / Fundraising" />,
    label: 'Donation / Fundraising',
    image: widgetIcon('gift'),
    description: (
      <Trans message="Link to GoFundMe, Apoia.se, Catarse, Pix or another support page." />
    ),
    descriptionText:
      'Link to GoFundMe, Apoia.se, Catarse, Pix or another support page.',
    dialog: DonationWidgetDialog,
    category: 'commerce',
    keywords: [
      'donation',
      'fundraising',
      'gofundme',
      'apoia',
      'catarse',
      'pix',
      'doacao',
      'apoio',
    ],
    sortOrder: 350,
    status: 'available',
  },
  viewerCount: {
    name: <Trans message="Live viewers" />,
    label: 'Live viewers',
    image: widgetIcon('audience'),
    description: (
      <Trans message="Show how many visitors are viewing your page right now." />
    ),
    descriptionText: 'Show how many visitors are viewing your page right now.',
    dialog: ViewerCountWidgetDialog,
    category: 'engagement',
    keywords: [
      'viewers',
      'live',
      'online',
      'eye',
      'visitors',
      'visualizacoes',
      'ao vivo',
    ],
    sortOrder: 25,
    status: 'hidden',
  },
  discordPresence: {
    name: <Trans message="Discord presence" />,
    label: 'Discord presence',
    image: widgetIcon('chat'),
    description: (
      <Trans message="Show your Discord username, availability and an invite link." />
    ),
    descriptionText:
      'Show your Discord username, availability and an invite link.',
    dialog: DiscordPresenceWidgetDialog,
    category: 'social',
    keywords: [
      'discord',
      'presence',
      'online',
      'community',
      'server',
      'gaming',
      'status',
    ],
    featured: true,
    sortOrder: 105,
    status: 'available',
  },
  gamingProfile: {
    name: <Trans message="Gaming profile" />,
    label: 'Gaming profile',
    image: widgetIcon('trophy'),
    description: (
      <Trans message="Show your gamertag, current game, platform, rank and player profile link." />
    ),
    descriptionText:
      'Show your gamertag, current game, platform, rank and player profile link.',
    dialog: GamingProfileWidgetDialog,
    category: 'social',
    keywords: [
      'gaming',
      'gamer',
      'game',
      'gamertag',
      'steam',
      'xbox',
      'playstation',
      'rank',
      'player',
    ],
    featured: true,
    sortOrder: 106,
    status: 'available',
  },
  spotlight: {
    name: <Trans message="Spotlight" />,
    label: 'Spotlight',
    image: widgetIcon('magic-wand'),
    description: (
      <Trans message="Present a story, profile or rich feature with benefits and one action." />
    ),
    descriptionText:
      'Present a story, profile or rich feature with benefits and one action.',
    dialog: SpotlightWidgetDialog,
    category: 'text',
    keywords: [
      'spotlight',
      'about',
      'story',
      'profile',
      'vehicle',
      'sobre',
      'historia',
      'ficha',
    ],
    featured: true,
    sortOrder: 360,
    status: 'available',
  },
  ctaBanner: {
    name: <Trans message="CTA banner" />,
    label: 'CTA banner',
    image: widgetIcon('megaphone'),
    description: (
      <Trans message="Highlight one important action in a compact promotional banner." />
    ),
    descriptionText:
      'Highlight one important action in a compact promotional banner.',
    dialog: CtaBannerWidgetDialog,
    category: 'commerce',
    keywords: [
      'cta',
      'banner',
      'promotion',
      'offer',
      'action',
      'promocao',
      'oferta',
    ],
    featured: true,
    sortOrder: 370,
    status: 'available',
  },
  logoCloud: {
    name: <Trans message="Logo cloud" />,
    label: 'Logo cloud',
    image: widgetIcon('network'),
    description: (
      <Trans message="Show partners, sponsors, certifications or payment methods." />
    ),
    descriptionText:
      'Show partners, sponsors, certifications or payment methods.',
    dialog: LogoCloudWidgetDialog,
    category: 'engagement',
    keywords: [
      'logos',
      'partners',
      'sponsors',
      'payments',
      'certifications',
      'parceiros',
      'patrocinadores',
      'pagamentos',
    ],
    sortOrder: 380,
    status: 'available',
  },
  socialFeed: {
    name: <Trans message="Social feed" />,
    label: 'Social feed',
    image: widgetIcon('share'),
    description: (
      <Trans message="Build a manual social wall with media, metrics and source links." />
    ),
    descriptionText:
      'Build a manual social wall with media, metrics and source links.',
    dialog: SocialFeedWidgetDialog,
    category: 'social',
    keywords: [
      'social',
      'feed',
      'wall',
      'posts',
      'instagram',
      'tiktok',
      'mural',
      'publicacoes',
    ],
    featured: true,
    sortOrder: 390,
    status: 'available',
  },
  countdown: {
    name: <Trans message="Countdown" />,
    label: 'Countdown',
    image: widgetIcon('calendar'),
    description: (
      <Trans message="Count down to an event, launch or limited-time offer." />
    ),
    descriptionText:
      'Count down to an event, launch or limited-time offer with timezone-aware completion behavior.',
    dialog: CountdownWidgetDialog,
    category: 'events',
    keywords: [
      'countdown',
      'timer',
      'launch',
      'event',
      'contagem regressiva',
      'temporizador',
      'lancamento',
      'evento',
    ],
    featured: true,
    sortOrder: 125,
    status: 'available',
  },
  audio: {
    name: <Trans message="Audio player" />,
    label: 'Audio player',
    image: widgetIcon('music'),
    description: (
      <Trans message="Upload audio or use an HTTPS URL with optional cover and credits." />
    ),
    descriptionText:
      'Upload audio or use an HTTPS URL with optional cover and credits.',
    dialog: AudioWidgetDialog,
    category: 'media',
    keywords: [
      'audio',
      'player',
      'mp3',
      'podcast',
      'voice',
      'som',
      'musica',
      'voz',
    ],
    featured: true,
    sortOrder: 75,
    status: 'available',
  },
  imageComparison: {
    name: <Trans message="Image comparison" />,
    label: 'Image comparison',
    image: widgetIcon('image'),
    description: (
      <Trans message="Compare before and after images with a touch and keyboard slider." />
    ),
    descriptionText:
      'Compare before and after images with a touch and keyboard slider.',
    dialog: ImageComparisonWidgetDialog,
    category: 'media',
    keywords: [
      'comparison',
      'before',
      'after',
      'slider',
      'comparacao',
      'antes',
      'depois',
    ],
    sortOrder: 195,
    status: 'available',
  },
};
