type MoveHistoryProps = {
  moves: string[];
};

export default function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <section className="panel">
      <h2>Trækhistorik</h2>
      <ol className="move-list">
        {moves.length === 0 && <li>Ingen træk endnu</li>}
        {moves.map((move, index) => (
          <li key={`${move}-${index}`}>
            {index + 1}. {move}
          </li>
        ))}
      </ol>
    </section>
  );
}
