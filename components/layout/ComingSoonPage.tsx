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

      <div className="placeholderGrid">
        <Card
          badge="V2 fundament"
          description="Denne sektion er forberedt i navigationen og kan nu udbygges uden at ændre den overordnede struktur."
          title="Klar til næste fase"
        />
        <Card
          badge="Planlagt"
          description="Næste iteration kan koble træningsdata, anbefalinger og mere avancerede flows på dette område."
          title="Retning"
        >
          <ul className="placeholderList">
            {focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
