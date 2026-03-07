type MoveHistoryProps = {
  moves: string[];
};

export default function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <div className="panel">
      <h2>Trækhistorik</h2>
      <ol className="moveList">
        {moves.length === 0 && <li className="emptyMove">Ingen træk endnu</li>}
        {moves.map((move, index) => (
          <li key={`${move}-${index}`}>{move}</li>
        ))}
      </ol>
    </div>
  );
}
