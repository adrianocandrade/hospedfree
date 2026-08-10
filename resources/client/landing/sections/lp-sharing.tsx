import {
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiPinterest,
  SiSnapchat,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import {LinkedinIcon} from '@ui/icons/social/linkedin';

const socialTiles = [
  // Row 1
  {name: 'Facebook', icon: SiFacebook, bg: 'var(--lp-card-lilac)'},
  {name: 'LinkedIn', icon: LinkedinIcon, bg: 'var(--lp-card-sky)'},
  {name: 'TikTok', icon: SiTiktok, bg: 'var(--lp-card-mint)'},
  {name: 'Snapchat', icon: SiSnapchat, bg: 'var(--lp-card-rose)'},
  {name: 'WhatsApp', icon: SiWhatsapp, bg: 'var(--lp-card-amber)'},
  {name: 'Spotify', icon: SiSpotify, bg: 'var(--lp-card-mint)'},
  {name: 'YouTube', icon: SiYoutube, bg: 'var(--lp-card-rose)'},
  // Row 2
  {name: 'X / Twitter', icon: SiX, bg: 'var(--lp-card-mint)'},
  {name: 'Twitch', icon: SiTwitch, bg: 'var(--lp-card-lilac)'},
  {name: 'Instagram', icon: SiInstagram, bg: 'var(--lp-section-gold)'},
  {name: 'Discord', icon: SiDiscord, bg: 'var(--lp-card-sky)'},
  {name: 'Pinterest', icon: SiPinterest, bg: 'var(--lp-card-rose)'},
  {name: 'Telegram', icon: SiTelegram, bg: 'var(--lp-card-sky)'},
  {name: 'Threads', icon: SiThreads, bg: 'var(--lp-card-amber)'},
];

export function LpSharing() {
  return (
    <section className="lp bg-[var(--lp-page-bg)] py-16 lg:py-24">
      <div className="lp-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-badge lp-badge--gold mb-5">
            Encontre sua audiência
          </span>
          <h2 className="lp-heading lp-heading--section">
            Compartilhe seu link para Instagram, TikTok e WhatsApp
          </h2>
          <p className="lp-subtext mx-auto mt-4">
            Adicione sua bio MeuLinkBio em todas as suas redes sociais e lugares
            para encontrar seu público.
          </p>
        </div>

        <div className="lp-social-grid mt-14">
          {socialTiles.map(tile => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.name}
                className="lp-social-tile"
                style={{background: tile.bg}}
                title={tile.name}
                role="img"
                aria-label={tile.name}
              >
                <Icon />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
