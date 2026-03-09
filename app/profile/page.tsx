'use client';

import PageHeader from '@/components/layout/PageHeader';
import ProfileOverview from '@/components/profile/ProfileOverview';
import Button from '@/components/ui/Button';
import { useOpeningsProgress } from '@/lib/openings/useOpeningsProgress';
import { useProfile } from '@/lib/profile/useProfile';

export default function ProfilePage() {
  const { profile, hasLoaded } = useProfile();
  const { progress, hasLoaded: hasOpeningsLoaded } = useOpeningsProgress();

  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow="Min profil"
        title="Se din udvikling og dit næste fokus"
        description="Her samles din lokale progression på tværs af partier, taktik og openings, så profilen bliver mere brugbar fra session til session."
        actions={
          <>
            <Button href="/play" variant="secondary">
              Spil nu
            </Button>
            <Button href="/openings" variant="ghost">
              Åbn openings
            </Button>
          </>
        }
      />

      <ProfileOverview
        hasLoaded={hasLoaded}
        hasOpeningsLoaded={hasOpeningsLoaded}
        openingsProgress={progress}
        profile={profile}
      />
    </main>
  );
}
