import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui';

export function SectionHero({
  badge,
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel = 'Back',
}: {
  badge?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="section-hero">
      <div className="section-hero-top">
        <div className="section-hero-copy">
          <div className="section-hero-kicker">
            {badge ? <span className="section-hero-badge">{badge}</span> : null}
            {eyebrow ? <strong>{eyebrow}</strong> : null}
          </div>
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        {action || backHref ? (
          <div className="section-hero-actions">
            {backHref ? (
              <ButtonLink href={backHref} icon={ArrowLeft} variant="outline">
                {backLabel}
              </ButtonLink>
            ) : null}
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}
