import {
  SiApplemusic,
  SiBandcamp,
  SiFacebook,
  SiInstagram,
  SiPatreon,
  SiPinterest,
  SiReddit,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {AmazonIcon} from '@ui/icons/social/amazon';
import {LinkedinIcon} from '@ui/icons/social/linkedin';
import {AtSignIcon} from 'lucide-react';
import {CSSProperties, ReactElement} from 'react';

export interface SocialsListItem {
  name: MessageDescriptor;
  placeholder: string;
  icon: ReactElement;
  inputType?: string;
  pattern?: string;
  brandStyle: CSSProperties;
}

export enum SocialsType {
  Mail = 'mail',
  Facebook = 'facebook',
  Twitter = 'twitter',
  Instagram = 'instagram',
  Tiktok = 'tiktok',
  Youtube = 'youtube',
  Soundcloud = 'soundcloud',
  Bandcamp = 'bandcamp',
  LinkedIn = 'linkedin',
  Whatsapp = 'whatsapp',
  Telegram = 'telegram',
  Twitch = 'twitch',
  Patreon = 'patreon',
  Pinterest = 'pinterest',
  Reddit = 'reddit',
  Spotify = 'spotify',
  Amazon = 'amazon',
  Snapchat = 'snapchat',
  Apple = 'apple',
}

export const SocialsList: Record<SocialsType, SocialsListItem> = {
  [SocialsType.Mail]: {
    name: message('Email'),
    placeholder: 'your@email.com',
    inputType: 'email',
    icon: <AtSignIcon />,
    brandStyle: {background: '#334155', color: '#ffffff'},
  },
  [SocialsType.Facebook]: {
    name: message('Facebook url'),
    placeholder: 'https://facebook.com/username',
    pattern: 'https://(www.)?facebook.com/[a-zA-Z0-9._%-]+$',
    inputType: 'url',
    icon: <SiFacebook />,
    brandStyle: {background: '#1877f2', color: '#ffffff'},
  },
  [SocialsType.Twitter]: {
    name: message('X (twitter) handle'),
    placeholder: '@yourxhandle',
    pattern: '^@[A-Za-z0-9_]{1,15}$',
    icon: <SiX />,
    brandStyle: {background: '#000000', color: '#ffffff'},
  },
  [SocialsType.Instagram]: {
    name: message('Instagram username'),
    placeholder: '@instagramusername',
    pattern: '^@[a-zA-Z0-9._%-]+$',
    icon: <SiInstagram />,
    brandStyle: {
      background:
        'linear-gradient(135deg, #833ab4 0%, #c42f65 56%, #a94313 100%)',
      color: '#ffffff',
    },
  },
  [SocialsType.Tiktok]: {
    name: message('TikTok username'),
    placeholder: '@tiktokusername',
    pattern: '^@[a-zA-Z0-9._%-]+$',
    icon: <SiTiktok />,
    brandStyle: {background: '#010101', color: '#ffffff'},
  },
  [SocialsType.Youtube]: {
    name: message('Youtube channel url'),
    placeholder: 'https://youtube.com/channel/youtubechannelurl',
    inputType: 'url',
    pattern: 'https://(www.)?youtube.com/channel/[a-zA-Z0-9._%-]+$',
    icon: <SiYoutube />,
    brandStyle: {background: '#ff0000', color: '#210000'},
  },
  [SocialsType.Soundcloud]: {
    name: message('SoundCloud url'),
    placeholder: 'https://soundcloud.com/username',
    inputType: 'url',
    pattern: 'https://(www.)?soundcloud.com/[a-zA-Z0-9._%-]+$',
    icon: <SiSoundcloud />,
    brandStyle: {background: '#ff5500', color: '#1d0a00'},
  },
  [SocialsType.Bandcamp]: {
    name: message('Bandcamp url'),
    placeholder: 'https://you.bandcamp.com',
    inputType: 'url',
    pattern: 'https://(www.)?[a-zA-Z0-9._%-]+.bandcamp.com$',
    icon: <SiBandcamp />,
    brandStyle: {background: '#1da0c3', color: '#061f27'},
  },
  [SocialsType.LinkedIn]: {
    name: message('LinkedIn url'),
    placeholder: 'https://linkedin.com/in/username',
    inputType: 'url',
    pattern: 'https://(www.)?linkedin.com/[a-zA-Z0-9._%-]+/[a-zA-Z0-9._%-]+$',
    icon: <LinkedinIcon />,
    brandStyle: {background: '#0a66c2', color: '#ffffff'},
  },
  [SocialsType.Whatsapp]: {
    name: message('WhatsApp'),
    placeholder: '+00000000000',
    pattern: '^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$',
    icon: <SiWhatsapp />,
    brandStyle: {background: '#25d366', color: '#052e16'},
  },
  [SocialsType.Telegram]: {
    name: message('Telegram url'),
    placeholder: 'https://t.me',
    inputType: 'url',
    pattern: 'https://(www.)?t.me/[a-zA-Z0-9._%-]+$',
    icon: <SiTelegram />,
    brandStyle: {background: '#229ed9', color: '#061f2b'},
  },
  [SocialsType.Twitch]: {
    name: message('Twitch url'),
    placeholder: 'https://twitch.tv/username',
    inputType: 'url',
    pattern: 'https://(www.)?twitch.tv/[a-zA-Z0-9._%-]+$',
    icon: <SiTwitch />,
    brandStyle: {background: '#9146ff', color: '#16052f'},
  },
  [SocialsType.Patreon]: {
    name: message('Patreon url'),
    placeholder: 'https://patreon.com/username',
    inputType: 'url',
    pattern: 'https://(www.)?patreon.com/[a-zA-Z0-9._%-]+$',
    icon: <SiPatreon />,
    brandStyle: {background: '#ff424d', color: '#2c0710'},
  },
  [SocialsType.Pinterest]: {
    name: message('Pinterest url'),
    placeholder: 'https://pinterest.com',
    inputType: 'url',
    pattern: 'https://(www.)?pinterest.com/.+',
    icon: <SiPinterest />,
    brandStyle: {background: '#bd081c', color: '#ffffff'},
  },
  [SocialsType.Reddit]: {
    name: message('Reddit url'),
    placeholder: 'https://reddit.com/user/username',
    inputType: 'url',
    pattern: 'https://(www.)?reddit.com/(user|u)/[a-zA-Z0-9_-]+/?$',
    icon: <SiReddit />,
    brandStyle: {background: '#ff4500', color: '#ffffff'},
  },
  [SocialsType.Spotify]: {
    name: message('Spotify artist url'),
    placeholder: 'https://open.spotify.com/artist/artistname',
    inputType: 'url',
    pattern: 'https://(www.)?open.spotify.com/artist/[a-zA-Z0-9._%-]+$',
    icon: <SiSpotify />,
    brandStyle: {background: '#1db954', color: '#052e16'},
  },
  [SocialsType.Amazon]: {
    name: message('Amazon shop url'),
    placeholder: 'https://amazon.com/shop/yourshopname',
    inputType: 'url',
    pattern: 'https://(www.)?amazon.com/shop/[a-zA-Z0-9._%-]+$',
    icon: <AmazonIcon />,
    brandStyle: {background: '#ff9900', color: '#201100'},
  },
  [SocialsType.Snapchat]: {
    name: message('Snapchat url'),
    placeholder: 'https://www.snapchat.com/add/yourusername',
    inputType: 'url',
    pattern: 'https://(www.)?snapchat.com/add/[a-zA-Z0-9_--%]+$',
    icon: <SiSnapchat />,
    brandStyle: {background: '#fffc00', color: '#111111'},
  },
  [SocialsType.Apple]: {
    name: message('Apple music url'),
    placeholder: 'https://music.apple.com/us/album/youralbum',
    inputType: 'url',
    pattern: 'https://(www.)?music.apple.com/.+',
    icon: <SiApplemusic />,
    brandStyle: {background: '#000000', color: '#ffffff'},
  },
};
