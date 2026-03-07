type GameInfoProps = {
  status: string;
  turn: string;
  onReset: () => void;
};

export default function GameInfo({ status, turn, onReset }: GameInfoProps) {
  return (
    <section className="panel">
      <h2>Partiinfo</h2>
      <p>
        <strong>Status:</strong> {status}
      </p>
      <p>
        <strong>Tur:</strong> {turn}
      </p>
      <button className="reset-btn" onClick={onReset} type="button">
        Nyt parti
      </button>
    </section>
  );
}
