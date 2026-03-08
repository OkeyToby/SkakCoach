import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { getXpIntoCurrentLevel, getXpToNextLevel } from '@/lib/profile/profileHelpers';
import type { PlayerProfile } from '@/lib/profile/profileTypes';

type Props = {
  profile: PlayerProfile;
  hasLoaded: boolean;
};

export default function ProfileOverview({ profile, hasLoaded }: Props) {
  const xpInLevel = getXpIntoCurrentLevel(profile);
  const xpToNextLevel = getXpToNextLevel();
  const progressPercentage = Math.min(100, Math.round((xpInLevel / xpToNextLevel) * 100));

  return (
    <div className="profileOverview">
      <div className="profileHero surfaceCard">
        <div className="profileHeroHeader">
          <div>
            <span className="cardEyebrow">Din progression</span>
            <h2 className="cardTitle">Niveau {profile.level}</h2>
          </div>
          <span className="cardBadge">{profile.xp} XP</span>
        </div>
        <p className="cardDescription">
          {hasLoaded
            ? 'Alt gemmes lokalt på din enhed, så du kan følge udviklingen fra træning til træning.'
            : 'Profilen indlæses, så din seneste progression kan vises.'}
        </p>
        <div className="progressBlock">
          <div className="progressMeta">
            <span>Frem mod næste niveau</span>
            <strong>
              {xpInLevel}/{xpToNextLevel} XP
            </strong>
          </div>
          <div className="progressTrack" aria-hidden="true">
            <div className="progressFill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="statsGrid">
        <StatCard accent="gold" label="Level" value={profile.level} hint="Stiger automatisk med din XP." />
        <StatCard accent="blue" label="XP" value={profile.xp} hint="Optjenes via partier og opgaver." />
        <StatCard accent="green" label="Streak" value={profile.streak} hint="Antal træningsdage i træk." />
        <StatCard label="Partier spillet" value={profile.gamesPlayed} hint="Alle afsluttede partier tæller." />
        <StatCard label="Partier vundet" value={profile.gamesWon} hint="Sejre mod computeren." />
        <StatCard label="Opgaver løst" value={profile.puzzlesSolved} hint="Korrekte taktiske løsninger." />
      </div>

      <div className="placeholderGrid">
        <Card
          badge="Kommer snart"
          description="Her samler vi mønstre i dit spil, fx centrumskontrol, taktisk skarphed og slutspil."
          title="Styrker"
        />
        <Card
          badge="Kommer snart"
          description="Fremtidige analyser vil pege på tilbagevendende fejl, så du kan træne mere målrettet."
          title="Svagheder"
        />
        <Card
          badge="Kommer snart"
          description="Badges bliver låst op for streaks, puzzles, sejre og særlige milepæle i træningen."
          title="Badges"
        />
      </div>
    </div>
  );
}
