import {LinkIcon, MousePointerClickIcon, QrCodeIcon, UsersIcon} from 'lucide-react';
import {LucideIcon} from 'lucide-react';
import {useLandingPageData} from '@app/landing/use-landing-page-data';

type StatDef = {
  key: 'users' | 'links' | 'clicks' | 'qrCodes';
  label: string;
  icon: LucideIcon;
};

const statDefs: StatDef[] = [
  {key: 'users', label: 'Usuários ativos', icon: UsersIcon},
  {key: 'links', label: 'Links gerenciados', icon: LinkIcon},
  {key: 'clicks', label: 'Cliques registrados', icon: MousePointerClickIcon},
  {key: 'qrCodes', label: 'QR Codes gerados', icon: QrCodeIcon},
];

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function LpTrustBar() {
  const query = useLandingPageData();
  const stats = statDefs.filter(s => query.data.stats[s.key] > 0);

  if (!stats.length) {
    return (
      <section className="lp bg-[var(--lp-page-bg)] py-10">
        <div className="lp-container text-center text-lg font-medium text-[var(--lp-text)]">
          Feito no Brasil para criadores, profissionais e empresas.
        </div>
      </section>
    );
  }

  return (
    <section className="lp bg-[var(--lp-page-bg)] py-10">
      <div className="lp-container">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="flex items-center gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-[var(--lp-radius-md)]"
                  style={{background: 'var(--lp-purple-soft)'}}
                >
                  <Icon className="size-5 text-[var(--lp-primary)]" />
                </div>
                <div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: 'var(--lp-font-display)',
                      color: 'var(--lp-ink)',
                    }}
                  >
                    {formatNumber(query.data.stats[stat.key])}
                  </div>
                  <div className="text-sm font-medium text-[var(--lp-muted)]">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
