import type {BiolinkWidgetType} from '@app/gen/schemas/biolink-widget-type';
import {
  LayoutPanelTopIcon,
  PanelsTopLeftIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from 'lucide-react';

export type WidgetEditorMode =
  | 'content'
  | 'design'
  | 'presentation'
  | 'advanced';

const designWidgetTypes = new Set<BiolinkWidgetType>([
  'linkedProduct',
  'linkedCourse',
  'service',
  'linkCollection',
  'embedCollection',
  'imageGallery',
  'reviews',
  'stats',
  'podcastMusic',
  'mobileApp',
  'eventList',
  'donation',
  'booking',
  'spotlight',
  'ctaBanner',
  'logoCloud',
  'socialFeed',
]);

const presentationWidgetTypes = new Set<BiolinkWidgetType>([
  'youtube',
  'emailSignup',
  'smsSignup',
  'imageGallery',
  'qrCode',
  'location',
  'contactCard',
  'genericVideo',
  'externalForm',
]);

const advancedWidgetTypes = new Set<BiolinkWidgetType>([
  'contactForm',
  'emailSignup',
  'eventRsvp',
  'smsSignup',
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
  'booking',
  'spotlight',
  'ctaBanner',
  'logoCloud',
  'socialFeed',
]);

export function getWidgetEditorModes(
  type: BiolinkWidgetType,
): Exclude<WidgetEditorMode, 'content'>[] {
  const modes: Exclude<WidgetEditorMode, 'content'>[] = [];

  if (designWidgetTypes.has(type)) {
    modes.push('design');
  }
  if (presentationWidgetTypes.has(type)) {
    modes.push('presentation');
  }
  if (advancedWidgetTypes.has(type)) {
    modes.push('advanced');
  }

  return modes;
}

export function getWidgetEditorModeIcon(
  mode: Exclude<WidgetEditorMode, 'content'>,
): LucideIcon {
  if (mode === 'design') {
    return PanelsTopLeftIcon;
  }

  if (mode === 'presentation') {
    return LayoutPanelTopIcon;
  }

  return SlidersHorizontalIcon;
}
