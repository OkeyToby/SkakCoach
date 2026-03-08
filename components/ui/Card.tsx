import type { Route } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';

type Props = {
  title?: string;
  description?: string;
  eyebrow?: string;
  badge?: string;
  href?: Route;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
};

export default function Card({
  title,
  description,
  eyebrow,
  badge,
  href,
  disabled = false,
  className,
  children,
}: Props) {
  const cardClassName = [
    'surfaceCard',
    href && !disabled ? 'surfaceCardInteractive' : '',
    disabled ? 'surfaceCardDisabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {(eyebrow || badge) && (
        <div className="cardMeta">
          {eyebrow ? <span className="cardEyebrow">{eyebrow}</span> : <span />}
          {badge ? <span className="cardBadge">{badge}</span> : null}
        </div>
      )}
      {title ? <h3 className="cardTitle">{title}</h3> : null}
      {description ? <p className="cardDescription">{description}</p> : null}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link className={cardClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
