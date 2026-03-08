import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from './PageHeader';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  focus: string[];
};

export default function ComingSoonPage({ eyebrow, title, description, focus }: Props) {
  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Button href="/play" variant="secondary">
              Til spillet
            </Button>
            <Button href="/tactics" variant="ghost">
              Træn taktik
            </Button>
          </>
        }
      />

      <section className="comingSoonIntro surfaceCard">
        <div className="comingSoonIntroHeader">
          <div>
            <span className="cardEyebrow">Kommer snart</span>
            <h2 className="cardTitle">Dette område er forberedt, men ikke bygget færdigt endnu</h2>
          </div>
          <span className="cardBadge">Fase 2</span>
        </div>
        <p className="cardDescription">
          Strukturen er allerede koblet på navigation og design, så næste modul kan bygges videre uden at bryde
          det, der virker i dag.
        </p>
        <div className="comingSoonPills">
          <span className="heroBadge">Klar rute</span>
          <span className="heroBadge">Samlet design</span>
          <span className="heroBadge">Forberedt til progression</span>
        </div>
      </section>

      <div className="placeholderGrid">
        <Card
          badge="V2 fundament"
          description="Denne sektion er forberedt i navigationen og kan nu udbygges uden at ændre den overordnede struktur."
          title="Klar til næste fase"
        >
          <ul className="placeholderList">
            <li>Rute og navigation er allerede på plads.</li>
            <li>Det visuelle system matcher resten af SkakCoach.</li>
            <li>Fremtidige data kan kobles på uden at rive layoutet op.</li>
          </ul>
        </Card>
        <Card
          badge="Planlagt indhold"
          description="Når modulet bliver bygget, skal det hurtigt kunne give brugeren reel træningsværdi."
          title="Det skal kunne dette"
        >
          <ul className="placeholderList">
            {focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card
          badge="Indtil da"
          description="De eksisterende moduler er allerede gode nok til daglig træning og progression."
          title="Fortsæt træningen nu"
        >
          <div className="placeholderActions">
            <Button href="/play" variant="secondary">
              Spil mod computeren
            </Button>
            <Button href="/tactics" variant="ghost">
              Løs taktiske opgaver
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
