import type { Route } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionTitle from '@/components/ui/SectionTitle';
import StatCard from '@/components/ui/StatCard';
import type { OpeningsProgressState } from '@/lib/openings/openingProgressTypes';
import {
  buildProfileInsights,
  type ProfileInsightCard,
} from '@/lib/profile/profileInsights';
import type { PlayerProfile } from '@/lib/profile/profileTypes';

type Props = {
  hasLoaded: boolean;
  hasOpeningsLoaded: boolean;
  openingsProgress: OpeningsProgressState;
  profile: PlayerProfile;
};

function getInsightCardClassName(tone: ProfileInsightCard['tone']): string {
  if (tone === 'positive') return 'profileInsightCard profileInsightCardPositive';
  if (tone === 'focus') return 'profileInsightCard profileInsightCardFocus';
  return 'profileInsightCard profileInsightCardNeutral';
}

export default function ProfileOverview({
  profile,
  openingsProgress,
  hasLoaded,
  hasOpeningsLoaded,
}: Props) {
  const insights = buildProfileInsights(profile, openingsProgress);
  const isReady = hasLoaded && hasOpeningsLoaded;
  const unlockedBadges = insights.badges.filter((badge) => badge.unlocked).length;

  return (
    <div className="profileOverview">
      <div className="profileHero surfaceCard">
        <div className="profileHeroHeader">
          <div>
            <span className="cardEyebrow">Overblik</span>
            <h2 className="cardTitle">{insights.trainingHeadline}</h2>
          </div>
          <span className="cardBadge">Niveau {profile.level}</span>
        </div>

        <p className="cardDescription">
          {isReady
            ? insights.trainingDescription
            : 'Profilen indlæses, så dine seneste tal, opening-fremskridt og anbefalinger kan samles.'}
        </p>

        <div className="profileHeroStats">
          <div>
            <span>XP</span>
            <strong>{profile.xp}</strong>
          </div>
          <div>
            <span>Streak</span>
            <strong>{profile.streak}</strong>
          </div>
          <div>
            <span>Badges</span>
            <strong>{unlockedBadges}</strong>
          </div>
          <div>
            <span>Openings i spil</span>
            <strong>{insights.practicedOpeningsCount}</strong>
          </div>
        </div>

        <p className="profileHeroNote">
          {insights.hasProgress
            ? `Du mangler ${insights.xpRemaining} XP til niveau ${profile.level + 1}. Seneste træning: ${insights.lastTrainingLabel}.`
            : 'Din profil er tom endnu, men alle sektioner er klar til at vågne, så snart du spiller eller træner.'}
        </p>

        <div className="progressBlock">
          <div className="progressMeta">
            <span>Frem mod næste niveau</span>
            <strong>
              {insights.xpInLevel}/{insights.xpToNextLevel} XP
            </strong>
          </div>
          <div className="progressTrack" aria-hidden="true">
            <div className="progressFill" style={{ width: `${insights.progressPercentage}%` }} />
          </div>
        </div>
      </div>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Overblik"
          title="Sådan ser din træning ud lige nu"
          description="Et hurtigt billede af dine tal, din rytme og hvordan dine åbninger fylder i træningen."
        />

        <div className="statsGrid">
          <StatCard accent="gold" label="Level" value={profile.level} hint="Stiger automatisk med din XP." />
          <StatCard accent="blue" label="XP" value={profile.xp} hint="Samlet erfaring på tværs af moduler." />
          <StatCard accent="green" label="Streak" value={profile.streak} hint="Antal træningsdage i træk." />
          <StatCard label="Partier spillet" value={profile.gamesPlayed} hint="Alle afsluttede partier tæller." />
          <StatCard label="Partier vundet" value={profile.gamesWon} hint="Sejre mod computeren." />
          <StatCard label="Opgaver løst" value={profile.puzzlesSolved} hint="Korrekte taktiske løsninger." />
          <StatCard
            label="Openings øvet"
            value={hasOpeningsLoaded ? insights.practicedOpeningsCount : 'Indlæser'}
            hint="Åbninger du allerede har taget med i spil."
          />
          <StatCard
            label="Badges låst op"
            value={unlockedBadges}
            hint="Milepæle du allerede har nået."
          />
        </div>

        <div className="profileSpotlightGrid">
          <Card
            badge="Træningsprofil"
            description={insights.trainingDescription}
            title={insights.trainingHeadline}
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Winrate</span>
                <strong>{insights.winRateLabel}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Seneste træning</span>
                <strong>{insights.lastTrainingLabel}</strong>
              </div>
            </div>
          </Card>

          <Card
            badge="Åbningsfokus"
            description={insights.favoriteOpeningSummary}
            title={insights.favoriteOpeningName ?? 'Ingen klar favorit endnu'}
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Set eller åbnet</span>
                <strong>{insights.viewedOpeningsCount}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Spillet mod computer</span>
                <strong>{insights.practicedOpeningsCount}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Quiz-kvalitet</span>
                <strong>{insights.openingAccuracyLabel}</strong>
              </div>
            </div>
          </Card>

          <Card
            badge="Form lige nu"
            description="Et praktisk snapshot af hvordan dine partier, sejre og tab ser ud i den aktuelle profil."
            title="Partiform og rytme"
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Sejrsrate</span>
                <strong>{insights.winRateLabel}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Tabte partier</span>
                <strong>{insights.losses}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Åbningspartier</span>
                <strong>{insights.openingPlaySessions}</strong>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Styrker"
          title="Det der ser sundt ud i din træning"
          description="Enkle, datadrevne mønstre som peger på, hvad der allerede fungerer."
        />

        <div className="profileInsightGrid">
          {insights.strengths.map((strength) => (
            <Card
              key={strength.title}
              badge={strength.badge}
              className={getInsightCardClassName(strength.tone)}
              description={strength.description}
              title={strength.title}
            />
          ))}
        </div>
      </section>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Svagheder"
          title="Rolige fokusområder lige nu"
          description="Ikke som domme, men som næste steder hvor lidt træning sandsynligvis giver mest igen."
        />

        <div className="profileInsightGrid">
          {insights.weaknesses.map((weakness) => (
            <Card
              key={weakness.title}
              badge={weakness.badge}
              className={getInsightCardClassName(weakness.tone)}
              description={weakness.description}
              title={weakness.title}
            />
          ))}
        </div>
      </section>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Fremskridt"
          title="Sådan bevæger din profil sig"
          description="Niveau, partier, taktik og openings samlet i ét mere læsbart fremdriftsbillede."
        />

        <div className="profileProgressGrid">
          <Card
            badge="Næste niveau"
            description={`Du mangler ${insights.xpRemaining} XP for at nå niveau ${profile.level + 1}.`}
            title={`Niveau ${profile.level}`}
          >
            <div className="progressBlock">
              <div className="progressMeta">
                <span>XP i dette niveau</span>
                <strong>
                  {insights.xpInLevel}/{insights.xpToNextLevel}
                </strong>
              </div>
              <div className="progressTrack" aria-hidden="true">
                <div className="progressFill" style={{ width: `${insights.progressPercentage}%` }} />
              </div>
            </div>
          </Card>

          <Card
            badge="Partier"
            description="Afsluttede partier giver dig det mest direkte billede af, hvordan du omsætter træning til spil."
            title="Praktisk partiform"
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Spillet</span>
                <strong>{profile.gamesPlayed}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Vundet</span>
                <strong>{profile.gamesWon}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Winrate</span>
                <strong>{insights.winRateLabel}</strong>
              </div>
            </div>
          </Card>

          <Card
            badge="Taktik"
            description="Taktik er stadig den letteste måde at hente hurtige procentpoint i rigtige partier."
            title="Taktisk arbejde"
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Opgaver løst</span>
                <strong>{profile.puzzlesSolved}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Streak</span>
                <strong>{profile.streak}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Næste spring</span>
                <strong>{profile.puzzlesSolved < 10 ? `${10 - profile.puzzlesSolved} til 10` : 'Mål nået'}</strong>
              </div>
            </div>
          </Card>

          <Card
            badge="Åbninger"
            description="Openings hjælper mest, når de både læres, quizz’es og prøves af i rigtige partier."
            title="Åbningsfremskridt"
          >
            <div className="profileMetricList">
              <div className="profileMetricRow">
                <span>Set eller åbnet</span>
                <strong>{insights.viewedOpeningsCount}/{insights.totalOpenings}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Færdige openings</span>
                <strong>{insights.completedOpeningsCount}</strong>
              </div>
              <div className="profileMetricRow">
                <span>Quiztrin løst</span>
                <strong>{insights.solvedOpeningSteps}</strong>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Badges / Milepæle"
          title="Små mål, der gør fremgangen synlig"
          description="Enkle milepæle baseret på data, appen allerede kender. Alt er stadig lokalt på din enhed."
        />

        <div className="profileBadgeGrid">
          {insights.badges.map((badge) => (
            <div
              key={badge.id}
              className={`surfaceCard profileBadgeCard${badge.unlocked ? ' profileBadgeCardUnlocked' : ''}`}
            >
              <div className="cardMeta">
                <span className="cardEyebrow">{badge.badgeText}</span>
                <span className="cardBadge">{badge.progressLabel}</span>
              </div>
              <h3 className="cardTitle">{badge.title}</h3>
              <p className="cardDescription">{badge.description}</p>
              <div className="profileBadgeTrack" aria-hidden="true">
                <div className="profileBadgeFill" style={{ width: `${badge.progressPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="profileSectionBlock">
        <SectionTitle
          eyebrow="Anbefalet næste træning"
          title="Prøv dette næste"
          description="Tre enkle næste skridt valgt ud fra din nuværende profil. Ingen magi, bare praktiske heuristikker."
        />

        <div className="profileRecommendationGrid">
          {insights.recommendations.map((recommendation) => (
            <Card
              key={recommendation.id}
              badge={recommendation.badge}
              className="profileRecommendationCard"
              description={recommendation.description}
              title={recommendation.title}
            >
              <div className="summaryEmptyActions">
                <Button href={recommendation.href as Route} variant="secondary">
                  {recommendation.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {!insights.hasProgress ? (
          <Card
            badge="Starter note"
            className="profileEmptyCard"
            description="Når du har lidt mere data, bliver anbefalingerne skarpere. Lige nu er målet bare at skabe de første spor."
            title="Din første session gør hele forskellen"
          >
            <div className="summaryEmptyActions">
              <Button href="/play" variant="secondary">
                Start et parti
              </Button>
              <Button href="/tactics" variant="ghost">
                Løs en opgave
              </Button>
            </div>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
