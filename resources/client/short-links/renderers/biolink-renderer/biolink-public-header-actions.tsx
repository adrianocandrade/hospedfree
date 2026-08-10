import {Drawer} from '@shadcn/drawer/drawer';
import {
  SiFacebook,
  SiTelegram,
  SiWhatsapp,
  SiX,
} from '@icons-pack/react-simple-icons';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {LinkedinIcon} from '@ui/icons/social/linkedin';
import {CheckIcon, CopyIcon, Link2Icon, Share2Icon, XIcon} from 'lucide-react';
import {RefObject, ReactNode, useEffect, useState} from 'react';
import {Link} from 'react-router';

type BiolinkPublicHeaderActionsProps = {
  boundaryRef: RefObject<HTMLSpanElement | null>;
  pageTitle: string;
  pageDescription?: string | null;
  pageUrl: string;
  pageHandle: string;
  avatarUrl?: string;
  profileColor?: string;
  profileTextColor?: string;
  showCreateAccount: boolean;
  showShare: boolean;
  isPreview?: boolean;
};

type SharePlatform = 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'x';

type ShareOption = {
  id: SharePlatform;
  label: string;
  color: string;
  icon: ReactNode;
};

const shareOptions: ShareOption[] = [
  {
    id: 'x',
    label: 'X',
    color: '#050505',
    icon: <SiX className="size-5" />,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: <SiFacebook className="size-5" />,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#16A85B',
    icon: <SiWhatsapp className="size-5" />,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    icon: <LinkedinIcon className="size-5" />,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#229ED9',
    icon: <SiTelegram className="size-5" />,
  },
];

export function BiolinkPublicHeaderActions({
  boundaryRef,
  pageTitle,
  pageDescription,
  pageUrl,
  pageHandle,
  avatarUrl,
  profileColor,
  profileTextColor,
  showCreateAccount,
  showShare,
  isPreview,
}: BiolinkPublicHeaderActionsProps) {
  const {branding} = useSettings();
  const [shareOpen, setShareOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [pastHeaderActions, setPastHeaderActions] = useState(false);
  const platformIcon =
    branding.logo_light_mobile || branding.logo_dark_mobile || branding.favicon;

  useEffect(() => {
    let animationFrame = 0;

    const updateVisibility = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const boundary = boundaryRef.current;
        if (!boundary) {
          return;
        }

        const fadeLine = Math.max(72, Math.round(window.innerHeight * 0.18));
        setPastHeaderActions(boundary.getBoundingClientRect().top <= fadeLine);
      });
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, {passive: true});
    window.addEventListener('resize', updateVisibility, {passive: true});
    document.addEventListener('scroll', updateVisibility, {
      capture: true,
      passive: true,
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
      document.removeEventListener('scroll', updateVisibility, true);
    };
  }, [boundaryRef]);

  return (
    <>
      <div
        className={cn(
          'biolink-public-header-actions pointer-events-none sticky z-30 -mb-11 flex h-11 w-full items-center justify-between px-3 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transform-none motion-reduce:transition-none',
          pastHeaderActions
            ? '-translate-y-1 opacity-0 [&>button]:pointer-events-none'
            : 'translate-y-0 opacity-100',
        )}
        style={{top: 'max(12px, env(safe-area-inset-top, 0px))'}}
        aria-hidden={pastHeaderActions}
      >
        {showCreateAccount ? (
          <button
            type="button"
            onClick={() => setSignupOpen(true)}
            tabIndex={pastHeaderActions ? -1 : undefined}
            className={cn(
              headerActionClassName,
              'size-11 min-w-11 border-0 bg-transparent p-0 text-primary shadow-none backdrop-blur-none hover:bg-transparent',
            )}
          >
            {platformIcon ? (
              <img
                src={platformIcon}
                alt=""
                className="size-11 object-contain"
              />
            ) : (
              <Link2Icon className="size-5" />
            )}
            <span className="sr-only">
              <Trans
                message="Create your account on :site"
                values={{site: branding.site_name}}
              />
            </span>
          </button>
        ) : (
          <span />
        )}
        {showShare ? (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            tabIndex={pastHeaderActions ? -1 : undefined}
            className={cn(
              headerActionClassName,
              'w-11 border-white/20 bg-slate-950/75 text-white hover:bg-slate-950/90',
            )}
          >
            <Share2Icon className="size-5" />
            <span className="sr-only">
              <Trans message="Share this page" />
            </span>
          </button>
        ) : null}
      </div>

      <ShareBiolinkDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        pageUrl={pageUrl}
        pageHandle={pageHandle}
        avatarUrl={avatarUrl}
        profileColor={profileColor}
        profileTextColor={profileTextColor}
        siteName={branding.site_name}
        isPreview={isPreview}
      />
      <CreateAccountDrawer
        open={signupOpen}
        onOpenChange={setSignupOpen}
        logo={
          branding.logo_dark || branding.logo_dark_mobile || branding.favicon
        }
        siteName={branding.site_name}
        isPreview={isPreview}
      />
    </>
  );
}

const headerActionClassName =
  'pointer-events-auto inline-flex h-11 min-w-11 items-center justify-center rounded-xl border shadow-[0_3px_8px_rgb(0_0_0_/_0.28)] backdrop-blur-md transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px motion-reduce:transition-none';

const promoLogoClassName =
  'inline-flex min-h-12 max-w-full items-center rounded-xl bg-white px-4 py-2 shadow-[0_4px_12px_rgb(15_23_42_/_0.14)]';

type ShareBiolinkDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageTitle: string;
  pageDescription?: string | null;
  pageUrl: string;
  pageHandle: string;
  avatarUrl?: string;
  profileColor?: string;
  profileTextColor?: string;
  siteName: string;
  isPreview?: boolean;
};

function ShareBiolinkDrawer({
  open,
  onOpenChange,
  pageTitle,
  pageDescription,
  pageUrl,
  pageHandle,
  avatarUrl,
  profileColor = '#111827',
  profileTextColor = '#FFFFFF',
  siteName,
  isPreview,
}: ShareBiolinkDrawerProps) {
  const {trans} = useTrans();
  const [copied, copyPageUrl] = useClipboard(pageUrl, {
    successDuration: 1800,
  });

  return (
    <Drawer.Root position="bottom" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="bg-black/60 motion-reduce:transition-none" />
        <Drawer.Content
          popupClassName="mx-auto w-full max-w-lg rounded-t-2xl bg-white text-slate-950 motion-reduce:transition-none"
          className="gap-5"
        >
          <Drawer.Header className="relative pe-12 text-left">
            <Drawer.Title className="text-base font-semibold text-slate-950">
              <Trans message="Share :title" values={{title: pageTitle}} />
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              <Trans message="Choose where you want to share this page." />
            </Drawer.Description>
            <Drawer.Close className="absolute end-0 -top-2 inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
              <XIcon className="size-5" />
              <span className="sr-only">
                <Trans message="Close" />
              </span>
            </Drawer.Close>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-5">
            <div
              className="flex min-h-48 flex-col items-center justify-center rounded-xl px-5 py-6 text-center"
              style={{
                backgroundColor: profileColor,
                color: profileTextColor,
              }}
            >
              <ProfileAvatar image={avatarUrl} title={pageTitle} />
              <div className="mt-3 text-xl font-bold text-balance">
                {pageTitle}
              </div>
              <div className="mt-1 text-sm opacity-80">@{pageHandle}</div>
              {pageDescription ? (
                <div className="mt-2 line-clamp-2 max-w-sm text-xs opacity-75">
                  {pageDescription}
                </div>
              ) : null}
            </div>

            <div
              className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2"
              aria-label={trans({message: 'Share options'})}
            >
              <button
                type="button"
                onClick={copyPageUrl}
                className="group flex min-w-16 snap-start flex-col items-center gap-2 text-center text-xs text-slate-700"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 transition-transform duration-150 group-hover:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-slate-950 motion-reduce:transition-none">
                  {copied ? (
                    <CheckIcon className="size-5" />
                  ) : (
                    <CopyIcon className="size-5" />
                  )}
                </span>
                <span>
                  {copied ? (
                    <Trans message="Copied" />
                  ) : (
                    <Trans message="Copy link" />
                  )}
                </span>
              </button>
              {shareOptions.map(option => (
                <ShareOptionButton
                  key={option.id}
                  option={option}
                  pageTitle={pageTitle}
                  pageUrl={pageUrl}
                />
              ))}
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="text-base font-semibold text-slate-950">
                <Trans
                  message="Create your own page on :site"
                  values={{site: siteName}}
                />
              </div>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                <Trans message="Bring your links, content and contacts together in one professional page." />
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/register"
                  target={isPreview ? '_blank' : undefined}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                >
                  <Trans message="Sign up for free" />
                </Link>
                <Link
                  to="/"
                  target={isPreview ? '_blank' : undefined}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                >
                  <Trans message="Learn more" />
                </Link>
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ShareOptionButton({
  option,
  pageTitle,
  pageUrl,
}: {
  option: ShareOption;
  pageTitle: string;
  pageUrl: string;
}) {
  return (
    <a
      href={buildShareUrl(option.id, pageTitle, pageUrl)}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-16 snap-start flex-col items-center gap-2 text-center text-xs text-slate-700"
    >
      <span
        className="flex size-12 items-center justify-center rounded-full text-white transition-transform duration-150 group-hover:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-slate-950 motion-reduce:transition-none"
        style={{backgroundColor: option.color}}
      >
        {option.icon}
      </span>
      <Trans message={option.label} />
    </a>
  );
}

function ProfileAvatar({image, title}: {image?: string; title: string}) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="size-20 rounded-full border-2 border-white/70 object-cover"
      />
    );
  }

  return (
    <span className="flex size-20 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-2xl font-bold">
      {title.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

function CreateAccountDrawer({
  open,
  onOpenChange,
  logo,
  siteName,
  isPreview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logo?: string;
  siteName: string;
  isPreview?: boolean;
}) {
  return (
    <Drawer.Root position="bottom" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="bg-black/60 motion-reduce:transition-none" />
        <Drawer.Content
          popupClassName="mx-auto w-full max-w-lg rounded-t-2xl bg-white text-slate-950 motion-reduce:transition-none"
          className="gap-0"
        >
          <Drawer.Header className="sr-only">
            <Drawer.Title>
              <Trans message="Create your account" />
            </Drawer.Title>
            <Drawer.Description>
              <Trans
                message="Create your professional link in bio on :site."
                values={{site: siteName}}
              />
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-[0_16px_36px_rgb(15_23_42_/_0.16)]">
              <Drawer.Close className="absolute end-3 top-3 inline-flex size-10 items-center justify-center rounded-lg bg-black/10 text-current/80 transition-colors hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
                <XIcon className="size-5" />
                <span className="sr-only">
                  <Trans message="Close" />
                </span>
              </Drawer.Close>

              {logo ? (
                <span className={promoLogoClassName}>
                  <img
                    src={logo}
                    alt={siteName}
                    className="h-7 w-auto max-w-40 object-contain"
                  />
                </span>
              ) : (
                <div
                  className={cn(
                    promoLogoClassName,
                    'size-12 justify-center px-0 text-slate-950',
                  )}
                >
                  <Link2Icon className="size-5" />
                </div>
              )}
              <h2 className="mt-7 max-w-sm text-2xl leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-3xl">
                <Trans message="Your professional page, ready without code." />
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-current/80">
                <Trans message="Create your account, choose a template and publish all your links, products and contacts in one place." />
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <Link
                  to="/register"
                  target={isPreview ? '_blank' : undefined}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                >
                  <Trans message="Create my free account" />
                </Link>
                <Link
                  to="/"
                  target={isPreview ? '_blank' : undefined}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-current/35 bg-white/10 px-5 text-sm font-semibold text-current transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  <Trans message="Explore :site" values={{site: siteName}} />
                </Link>
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function buildShareUrl(
  platform: SharePlatform,
  pageTitle: string,
  pageUrl: string,
): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(pageTitle);
  const encodedMessage = encodeURIComponent(`${pageTitle} — ${pageUrl}`);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedMessage}`;
    case 'x':
      return `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`;
  }
}
