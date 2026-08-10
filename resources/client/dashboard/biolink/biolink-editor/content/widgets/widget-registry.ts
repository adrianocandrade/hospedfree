import {BookingWidgetDialog} from './booking-widget/booking-widget-dialog';
import {
  AudioWidgetDialog,
  CountdownWidgetDialog,
  ImageComparisonWidgetDialog,
} from './enhanced-widgets/enhanced-widgets';
import {ImageWidgetDialog} from './image-widget/image-widget-dialog';
import {MusicHubWidgetDialog} from './music-hub-widget/music-hub-widget';
import {
  ContactCardWidgetDialog,
  ContactFormWidgetDialog,
  DiscountCodeWidgetDialog,
  DiscordPresenceWidgetDialog,
  DocumentWidgetDialog,
  DonationWidgetDialog,
  EmailSignupWidgetDialog,
  EmbedCollectionWidgetDialog,
  EventListWidgetDialog,
  EventRsvpWidgetDialog,
  ExternalFormWidgetDialog,
  FaqWidgetDialog,
  GamingProfileWidgetDialog,
  GenericVideoWidgetDialog,
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
} from './new-widgets/new-widgets';
import {
  CtaBannerWidgetDialog,
  LogoCloudWidgetDialog,
  SocialFeedWidgetDialog,
  SpotlightWidgetDialog,
} from './showcase-widgets/showcase-widgets';
import {SocialsWidgetDialog} from './socials-widget/socials-widget-dialog';
import {SoundcloudWidgetDialog} from './soundcloud-widget/soundcloud-widget-dialog';
import {TextWidgetDialog} from './text-widget/text-widget-dialog';
import {TiktokWidgetDialog} from './tiktok-widget/tiktok-widget-dialog';
import {TwitchWidgetDialog} from './twitch-widget/twitch-widget-dialog';
import {ViewerCountWidgetDialog} from './viewer-count-widget/viewer-count-widget-dialog';
import {VimeoWidgetDialog} from './vimeo-widget/vimeo-widget-dialog';
import {WidgetRenderers} from './widget-renderers';
import {YoutubeWidgetDialog} from './youtube-widget/youtube-widget-dialog';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import type {JSXElementConstructor} from 'react';
import type {WidgetRendererProps} from './widget-renderer-props';

type WidgetRegistryEntry = {
  dialog: JSXElementConstructor<any>;
  renderer: JSXElementConstructor<WidgetRendererProps<any>>;
};

/**
 * Technical registry: exactly one editor and renderer for every persisted
 * widget type. Presets belong to WidgetCatalogEntries and never appear here.
 */
export const WidgetRegistry: Record<
  BiolinkWidget['type'],
  WidgetRegistryEntry
> = {
  image: {dialog: ImageWidgetDialog, renderer: WidgetRenderers.image},
  text: {dialog: TextWidgetDialog, renderer: WidgetRenderers.text},
  socials: {dialog: SocialsWidgetDialog, renderer: WidgetRenderers.socials},
  youtube: {dialog: YoutubeWidgetDialog, renderer: WidgetRenderers.youtube},
  soundcloud: {
    dialog: SoundcloudWidgetDialog,
    renderer: WidgetRenderers.soundcloud,
  },
  vimeo: {dialog: VimeoWidgetDialog, renderer: WidgetRenderers.vimeo},
  spotify: {dialog: MusicHubWidgetDialog, renderer: WidgetRenderers.spotify},
  twitch: {dialog: TwitchWidgetDialog, renderer: WidgetRenderers.twitch},
  tiktok: {dialog: TiktokWidgetDialog, renderer: WidgetRenderers.tiktok},
  contactForm: {
    dialog: ContactFormWidgetDialog,
    renderer: WidgetRenderers.contactForm,
  },
  emailSignup: {
    dialog: EmailSignupWidgetDialog,
    renderer: WidgetRenderers.emailSignup,
  },
  eventRsvp: {
    dialog: EventRsvpWidgetDialog,
    renderer: WidgetRenderers.eventRsvp,
  },
  linkedProduct: {
    dialog: LinkedProductWidgetDialog,
    renderer: WidgetRenderers.linkedProduct,
  },
  linkedCourse: {
    dialog: LinkedCourseWidgetDialog,
    renderer: WidgetRenderers.linkedCourse,
  },
  service: {dialog: ServiceWidgetDialog, renderer: WidgetRenderers.service},
  booking: {dialog: BookingWidgetDialog, renderer: WidgetRenderers.booking},
  faq: {dialog: FaqWidgetDialog, renderer: WidgetRenderers.faq},
  linkCollection: {
    dialog: LinkCollectionWidgetDialog,
    renderer: WidgetRenderers.linkCollection,
  },
  embedCollection: {
    dialog: EmbedCollectionWidgetDialog,
    renderer: WidgetRenderers.embedCollection,
  },
  imageGallery: {
    dialog: ImageGalleryWidgetDialog,
    renderer: WidgetRenderers.imageGallery,
  },
  qrCode: {dialog: QrCodeWidgetDialog, renderer: WidgetRenderers.qrCode},
  location: {dialog: LocationWidgetDialog, renderer: WidgetRenderers.location},
  contactCard: {
    dialog: ContactCardWidgetDialog,
    renderer: WidgetRenderers.contactCard,
  },
  smsSignup: {
    dialog: SmsSignupWidgetDialog,
    renderer: WidgetRenderers.smsSignup,
  },
  poll: {dialog: PollWidgetDialog, renderer: WidgetRenderers.poll},
  reviews: {dialog: ReviewsWidgetDialog, renderer: WidgetRenderers.reviews},
  stats: {dialog: StatsWidgetDialog, renderer: WidgetRenderers.stats},
  discountCode: {
    dialog: DiscountCodeWidgetDialog,
    renderer: WidgetRenderers.discountCode,
  },
  document: {dialog: DocumentWidgetDialog, renderer: WidgetRenderers.document},
  genericVideo: {
    dialog: GenericVideoWidgetDialog,
    renderer: WidgetRenderers.genericVideo,
  },
  podcastMusic: {
    dialog: MusicHubWidgetDialog,
    renderer: WidgetRenderers.podcastMusic,
  },
  mobileApp: {
    dialog: MobileAppWidgetDialog,
    renderer: WidgetRenderers.mobileApp,
  },
  eventList: {
    dialog: EventListWidgetDialog,
    renderer: WidgetRenderers.eventList,
  },
  externalForm: {
    dialog: ExternalFormWidgetDialog,
    renderer: WidgetRenderers.externalForm,
  },
  rssFeed: {dialog: RssFeedWidgetDialog, renderer: WidgetRenderers.rssFeed},
  donation: {dialog: DonationWidgetDialog, renderer: WidgetRenderers.donation},
  viewerCount: {
    dialog: ViewerCountWidgetDialog,
    renderer: WidgetRenderers.viewerCount,
  },
  discordPresence: {
    dialog: DiscordPresenceWidgetDialog,
    renderer: WidgetRenderers.discordPresence,
  },
  gamingProfile: {
    dialog: GamingProfileWidgetDialog,
    renderer: WidgetRenderers.gamingProfile,
  },
  spotlight: {
    dialog: SpotlightWidgetDialog,
    renderer: WidgetRenderers.spotlight,
  },
  ctaBanner: {
    dialog: CtaBannerWidgetDialog,
    renderer: WidgetRenderers.ctaBanner,
  },
  logoCloud: {
    dialog: LogoCloudWidgetDialog,
    renderer: WidgetRenderers.logoCloud,
  },
  socialFeed: {
    dialog: SocialFeedWidgetDialog,
    renderer: WidgetRenderers.socialFeed,
  },
  countdown: {
    dialog: CountdownWidgetDialog,
    renderer: WidgetRenderers.countdown,
  },
  audio: {dialog: AudioWidgetDialog, renderer: WidgetRenderers.audio},
  imageComparison: {
    dialog: ImageComparisonWidgetDialog,
    renderer: WidgetRenderers.imageComparison,
  },
};
