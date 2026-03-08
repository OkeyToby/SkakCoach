import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { getXpIntoCurrentLevel, getXpToNextLevel, hasRealProgress } from '@/lib/profile/profileHelpers';
import type { PlayerProfile } from '@/lib/profile/profileTypes';

type Props = {
  profile: PlayerProfile;
  hasLoaded: boolean;
};

export default function ProfileOverview({ profile, hasLoaded }: Props) {
  const xpInLevel = getXpIntoCurrentLevel(profile);
  const xpToNextLevel = getXpToNextLevel();
  const progressPercentage = Math.min(100, Math.round((xpInLevel / xpToNextLevel) * 100));
  const hasProgress = hasRealProgress(profile);
  const xpRemaining = Math.max(0, xpToNextLevel - xpInLevel);
  const losses = Math.max(0, profile.gamesPlayed - profile.gamesWon);
  const winRate = profile.gamesPlayed > 0 ? `${Math.round((profile.gamesWon / profile.gamesPlayed) * 100)}%` : 'Ingen data';
  const lastTrainingLabel = formatDateLabel(profile.lastPlayedDate);

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
        <div className="profileHeroStats">
          <div>
            <span>Streak</span>
            <strong>{profile.streak}</strong>
          </div>
          <div>
            <span>Opgaver</span>
            <strong>{profile.puzzlesSolved}</strong>
          </div>
          <div>
            <span>Sejre</span>
            <strong>{profile.gamesWon}</strong>
          </div>
        </div>
        <p className="profileHeroNote">
          {hasProgress
            ? `Du mangler ${xpRemaining} XP til niveau ${profile.level + 1}. Seneste træning: ${lastTrainingLabel}.`
            : 'Du har endnu ikke registreret træning. Ét parti eller én opgave er nok til at tænde din progression.'}
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

      {hasProgress ? (
        <div className="profileSpotlightGrid">
          <Card badge="Næste milepæl" title={`På vej mod niveau ${profile.level + 1}`}>
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Mangler</span>
                <strong>{xpRemaining} XP</strong>
              </div>
              <div className="profileMetricRow">
                <span>Seneste træningsdag</span>
                <strong>{lastTrainingLabel}</strong>
              </div>
            </div>
          </Card>
          <Card badge="Form lige nu" title="Din træningspuls">
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Sejrsrate</span>
                <strong>{winRate}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Tabte partier</span>
                <strong>{losses}</strong>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card
          badge="Klar til første session"
          className="profileEmptyCard"
          description="SkakCoach begynder at bygge din profil, så snart du træner. Alt gemmes lokalt og opdateres med det samme."
          title="Ingen historik endnu"
        >
          <div className="starterSteps">
            <div>
              <strong>1</strong>
              <span>Spil et parti for at tælle partier, sejre og XP.</span>
            </div>
            <div>
              <strong>2</strong>
              <span>Løs en opgave for at øge både puzzles og level-progress.</span>
            </div>
            <div>
              <strong>3</strong>
              <span>Kom tilbage i morgen for at starte eller holde din streak i live.</span>
            </div>
          </div>
          <div className="summaryEmptyActions">
            <Button href="/play" variant="secondary">
              Start et parti
            </Button>
            <Button href="/tactics" variant="ghost">
              Løs en opgave
            </Button>
          </div>
        </Card>
      )}

      <div className="placeholderGrid">
        <Card
          badge="Kommer snart"
          description="Her samler vi mønstre i dit spil, fx centrumskontrol, taktisk skarphed og slutspil, så profilen bliver mere personlig."
          title="Styrker"
        />
        <Card
          badge="Kommer snart"
          description="Fremtidige analyser vil pege på tilbagevendende fejl og mønstre, så du kan vælge næste træning mere målrettet."
          title="Svagheder"
        />
        <Card
          badge="Kommer snart"
          description="Badges bliver låst op for streaks, puzzles, sejre og særlige milepæle, så progression også føles som en belønning."
          title="Badges"
        />
      </div>
    </div>
  );
}

function formatDateLabel(dateKey: string | null): string {
  if (!dateKey) {
    return 'Ingen træning endnu';
  }

  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}.${year}`;
}
