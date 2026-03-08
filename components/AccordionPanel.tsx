import { type ReactNode, useState } from 'react';

type Props = {
  title: string;
  defaultOpen?: boolean;
  summaryValue?: string;
  children: ReactNode;
};

export default function AccordionPanel({
  title,
  defaultOpen = false,
  summaryValue,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="panel accordionPanel"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className="accordionSummary">
        <div className="accordionTitleGroup">
          <h2>{title}</h2>
          {summaryValue ? <span className="accordionSummaryValue">{summaryValue}</span> : null}
        </div>
        <span aria-hidden="true" className="accordionChevron" />
      </summary>

      <div className="accordionBody">{children}</div>
    </details>
  );
}
