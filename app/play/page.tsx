import PlayExperience from '@/components/play/PlayExperience';

type Props = {
  searchParams?: {
    opening?: string | string[];
  };
};

export default function PlayPage({ searchParams }: Props) {
  const openingParam = searchParams?.opening;
  const openingSlug = typeof openingParam === 'string' ? openingParam : undefined;

  return (
    <main className="shellContainer pageMain">
      <PlayExperience openingSlug={openingSlug} />
    </main>
  );
}
