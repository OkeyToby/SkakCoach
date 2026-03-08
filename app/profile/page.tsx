'use client';

import PageHeader from '@/components/layout/PageHeader';
import ProfileOverview from '@/components/profile/ProfileOverview';
import Button from '@/components/ui/Button';
import { useProfile } from '@/lib/profile/useProfile';

export default function ProfilePage() {
  const { profile, hasLoaded } = useProfile();

  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow="Min profil"
        title="Se din udvikling"
        description="Her samles din lokale progression på tværs af partier og taktiske opgaver, så du kan følge din træning over tid."
        actions={
          <>
            <Button href="/play" variant="secondary">
              Spil nu
            </Button>
            <Button href="/tactics" variant="ghost">
              Løs opgaver
            </Button>
          </>
        }
      />

      <ProfileOverview hasLoaded={hasLoaded} profile={profile} />
    </main>
  );
}
