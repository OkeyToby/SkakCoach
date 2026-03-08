import ComingSoonPage from '@/components/layout/ComingSoonPage';

export default function OpeningsPage() {
  return (
    <ComingSoonPage
      eyebrow="Åbninger"
      title="Lær åbninger med planer på dansk"
      description="Åbningsdelen er forberedt som næste større modul. Målet er korte repertoirer, planer og typiske faldgruber."
      focus={['Repertoirer for hvid og sort', 'Typiske planer pr. åbning', 'Hurtige tests og repetition']}
    />
  );
}
