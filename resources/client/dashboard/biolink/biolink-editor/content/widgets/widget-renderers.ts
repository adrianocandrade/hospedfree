import {ImageWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/image-widget/image-widget-renderer';
import {BookingWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/booking-widget/booking-widget-renderer';
import {MusicHubWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/music-hub-widget/music-hub-widget';
import {SocialsWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-widget-renderer';
import {SoundcloudWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/soundcloud-widget/soundcloud-widget-renderer';
import {TextWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/text-widget/text-widget-renderer';
import {TiktokWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/tiktok-widget/tiktok-widget-renderer';
import {TwitchWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/twitch-widget/twitch-widget-renderer';
import {VimeoWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/vimeo-widget/vimeo-widget-renderer';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {YoutubeWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/youtube-widget/youtube-widget-renderer';
import {ViewerCountWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/viewer-count-widget/viewer-count-widget-renderer';
import {RssFeedWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/rss-feed-widget-renderer';
import {
  AudioWidgetRenderer,
  CountdownWidgetRenderer,
  ImageComparisonWidgetRenderer,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/enhanced-widgets/enhanced-widgets';
import {
  CaptureWidgetRenderer,
  ContactCardWidgetRenderer,
  DiscountCodeWidgetRenderer,
  DiscordPresenceWidgetRenderer,
  EmbedCollectionWidgetRenderer,
  FaqWidgetRenderer,
  GamingProfileWidgetRenderer,
  GenericListWidgetRenderer,
  ImageGalleryWidgetRenderer,
  LinkCollectionWidgetRenderer,
  LocationWidgetRenderer,
  OfferWidgetRenderer,
  PollWidgetRenderer,
  QrCodeWidgetRenderer,
  ReviewsWidgetRenderer,
  SimpleLinkWidgetRenderer,
  StatsWidgetRenderer,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/new-widgets';
import {
  CtaBannerWidgetRenderer,
  LogoCloudWidgetRenderer,
  SocialFeedWidgetRenderer,
  SpotlightWidgetRenderer,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/showcase-widgets/showcase-widgets';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {JSXElementConstructor} from 'react';

export const WidgetRenderers: Record<
  BiolinkWidget['type'],
  JSXElementConstructor<WidgetRendererProps<any>>
> = {
  image: ImageWidgetRenderer,
  text: TextWidgetRenderer,
  socials: SocialsWidgetRenderer,
  youtube: YoutubeWidgetRenderer,
  soundcloud: SoundcloudWidgetRenderer,
  vimeo: VimeoWidgetRenderer,
  spotify: MusicHubWidgetRenderer,
  twitch: TwitchWidgetRenderer,
  tiktok: TiktokWidgetRenderer,
  contactForm: CaptureWidgetRenderer,
  emailSignup: CaptureWidgetRenderer,
  eventRsvp: CaptureWidgetRenderer,
  linkedProduct: OfferWidgetRenderer,
  linkedCourse: OfferWidgetRenderer,
  service: OfferWidgetRenderer,
  booking: BookingWidgetRenderer,
  faq: FaqWidgetRenderer,
  linkCollection: LinkCollectionWidgetRenderer,
  embedCollection: EmbedCollectionWidgetRenderer,
  imageGallery: ImageGalleryWidgetRenderer,
  qrCode: QrCodeWidgetRenderer,
  location: LocationWidgetRenderer,
  contactCard: ContactCardWidgetRenderer,
  smsSignup: CaptureWidgetRenderer,
  poll: PollWidgetRenderer,
  reviews: ReviewsWidgetRenderer,
  stats: StatsWidgetRenderer,
  discountCode: DiscountCodeWidgetRenderer,
  document: SimpleLinkWidgetRenderer,
  genericVideo: SimpleLinkWidgetRenderer,
  podcastMusic: MusicHubWidgetRenderer,
  mobileApp: GenericListWidgetRenderer,
  eventList: GenericListWidgetRenderer,
  externalForm: SimpleLinkWidgetRenderer,
  rssFeed: RssFeedWidgetRenderer,
  donation: OfferWidgetRenderer,
  viewerCount: ViewerCountWidgetRenderer,
  discordPresence: DiscordPresenceWidgetRenderer,
  gamingProfile: GamingProfileWidgetRenderer,
  spotlight: SpotlightWidgetRenderer,
  ctaBanner: CtaBannerWidgetRenderer,
  logoCloud: LogoCloudWidgetRenderer,
  socialFeed: SocialFeedWidgetRenderer,
  countdown: CountdownWidgetRenderer,
  audio: AudioWidgetRenderer,
  imageComparison: ImageComparisonWidgetRenderer,
};
