type Props = {
  variant: 'korrekt' | 'forkert' | 'neutral';
  title: string;
  description: string;
};

export default function PuzzleFeedback({ variant, title, description }: Props) {
  return (
    <div className={`puzzleFeedback puzzleFeedback${variant[0].toUpperCase()}${variant.slice(1)}`}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
