import {
  BoxesIcon,
  DatabaseIcon,
  FileCode2Icon,
  FolderOpenIcon,
  Globe2Icon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MailIcon,
  NewspaperIcon,
  RocketIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

const categoryIconRules: Array<[RegExp, LucideIcon]> = [
  [/ssl|https|certific|segur/, ShieldCheckIcon],
  [/mysql|banco|database|dados/, DatabaseIcon],
  [/arquivo|ftp|upload|backup/, FolderOpenIcon],
  [/dominio|dns|subdominio|site/, Globe2Icon],
  [/wordpress|aplic|instal|softaculous/, BoxesIcon],
  [/painel|conta|inicio|primeiro/, LayoutDashboardIcon],
  [/email|correio/, MailIcon],
  [/senha|acesso/, KeyRoundIcon],
  [/public|deploy|colocar no ar/, RocketIcon],
  [/codigo|php|desenvolv/, FileCode2Icon],
  [/erro|problema|solu|diagnost/, WrenchIcon],
];

export function PublicCategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const Icon =
    categoryIconRules.find(([pattern]) => pattern.test(normalizedName))?.[1] ??
    NewspaperIcon;

  return <Icon aria-hidden="true" className={className} />;
}
