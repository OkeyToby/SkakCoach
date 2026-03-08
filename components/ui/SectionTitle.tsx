type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export default function SectionTitle({ title, description, eyebrow }: Props) {
  return (
    <div className="sectionTitle">
      {eyebrow ? <p className="sectionEyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="sectionDescription">{description}</p> : null}
    </div>
  );
}
