import { type ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, eyebrow, actions, className }: Props) {
  return (
    <section className={className ? `pageHeader ${className}` : 'pageHeader'}>
      <div className="pageHeaderContent">
        {eyebrow ? <p className="sectionEyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="pageHeaderActions">{actions}</div> : null}
    </section>
  );
}
