import AccordionPanel from './AccordionPanel';

type MoveHistoryProps = {
  moves: string[];
};

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const latestMove = moves.at(-1) ?? 'Ingen træk';

  return (
    <AccordionPanel defaultOpen={false} summaryValue={latestMove} title="Historik">
      <ol className="moveList">
        {moves.length === 0 && <li className="emptyMove">Ingen træk endnu</li>}
        {moves.map((move, index) => (
          <li key={`${move}-${index}`}>{move}</li>
        ))}
      </ol>
    </AccordionPanel>
  );
}
