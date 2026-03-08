import { type ReactNode } from 'react';

type Props = {
  variant: 'korrekt' | 'forkert' | 'neutral';
  title: string;
  description: string;
  detail?: string;
  children?: ReactNode;
};

export default function PuzzleFeedback({ variant, title, description, detail, children }: Props) {
  return (
    <div className={`puzzleFeedback puzzleFeedback${variant[0].toUpperCase()}${variant.slice(1)}`}>
      <strong>{title}</strong>
      <p>{description}</p>
      {detail ? <p className="puzzleFeedbackDetail">{detail}</p> : null}
      {children ? <div className="puzzleFeedbackActions">{children}</div> : null}
    </div>
  );
}
