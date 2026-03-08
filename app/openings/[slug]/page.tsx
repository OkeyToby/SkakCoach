import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OpeningDetailClient from '@/components/openings/OpeningDetailClient';
import { getOpeningBySlug, openingSlugs } from '@/data/openings/openings';

type Props = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return openingSlugs.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const opening = getOpeningBySlug(params.slug);

  if (!opening) {
    return {
      title: 'Åbning ikke fundet',
    };
  }

  return {
    title: opening.name,
    description: opening.shortDescription,
  };
}

export default function OpeningDetailPage({ params }: Props) {
  const opening = getOpeningBySlug(params.slug);

  if (!opening) {
    notFound();
  }

  return <OpeningDetailClient opening={opening} />;
}
