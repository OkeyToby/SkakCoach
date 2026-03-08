'use client';

import type { Route } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionTitle from '@/components/ui/SectionTitle';
import StatCard from '@/components/ui/StatCard';
import { getXpIntoCurrentLevel, getXpToNextLevel, hasRealProgress } from '@/lib/profile/profileHelpers';
import { useProfile } from '@/lib/profile/useProfile';

const featureCards: Array<{
  title: string;
  description: string;
  href: Route;
  badge: string;
  eyebrow: string;
  detail: string;
}> = [
  {
    title: 'Spil mod computeren',
    description: 'Spil et helt parti med dansk coach før og efter dine træk.',
    href: '/play',
    badge: 'Klar nu',
    eyebrow: 'Spil',
    detail: 'Før og efter hvert træk',
  },
  {
    title: 'Taktik',
    description: 'Løs fokuserede opgaver og træn mønstre som mat, gafler og bindinger.',
    href: '/tactics',
    badge: 'Klar nu',
    eyebrow: 'Træning',
    detail: 'Korte opgaver med XP',
  },
  {
    title: 'Åbninger',
    description: 'Lær korte starterlinjer, planer og typiske fejl gennem små quizforløb.',
    href: '/openings',
    badge: 'Klar nu',
    eyebrow: 'Forberedelse',
    detail: 'Planer, fejl og quiz',
  },
  {
    title: 'Spil som en GM',
    description: 'Træn stormesteridéer, kandidatvalg og beslutninger under pres.',
    href: '/gm',
    badge: 'Kommer snart',
    eyebrow: 'Fordybelse',
    detail: 'Stormesterinspirerede scenarier',
  },
  {
    title: 'Min profil',
    description: 'Se level, XP, streak og dine samlede fremskridt ét sted.',
    href: '/profile',
    badge: 'Klar nu',
    eyebrow: 'Overblik',
    detail: 'Lokal progression og milepæle',
  },
];

const dailyChallenge = [
  'Løs 3 taktiske opgaver',
  'Spil 1 parti mod computeren',
  'Hold streaken i live i dag',
];

export default function HomePage() {
  const { profile, hasLoaded } = useProfile();
  const hasProgress = hasRealProgress(profile);
  const xpInLevel = getXpIntoCurrentLevel(profile);
  const xpToNextLevel = getXpToNextLevel();
  const xpRemaining = Math.max(0, xpToNextLevel - xpInLevel);

  return (
    <main className="shellContainer pageMain homePage">
      <section className="homeHero surfaceCard">
        <div className="homeHeroContent">
          <p className="sectionEyebrow">Skaktræning på dansk</p>
          <h1>SkakCoach</h1>
          <p className="homeHeroLead">
            Bliv bedre til skak med forklaringer, træning og udfordringer – helt på dansk.
          </p>
          <div className="heroBadgeRow">
            <span className="heroBadge">Computerpartier</span>
            <span className="heroBadge">Taktik med XP</span>
            <span className="heroBadge">Progression lokalt</span>
          </div>
          <div className="heroActions">
            <Button href="/play" size="stor">
              Start træning
            </Button>
            <Button href="/tactics" size="stor" variant="secondary">
              Løs opgaver
            </Button>
          </div>
        </div>

        <div className="homeHeroAside">
          <Card
            badge={hasLoaded ? `Niveau ${profile.level}` : 'Indlæser'}
            description={
              hasProgress
                ? 'Din profil er aktiv. Fortsæt hvor du slap og saml XP fra både partier og opgaver.'
                : 'Din profil starter lokalt på denne enhed. Det første parti eller den første opgave tænder progressionen.'
            }
            eyebrow="Progressionsblik"
            title={hasProgress ? 'Du er i gang' : 'Klar til første træning'}
          >
            <div className="heroMiniStats">
              <div>
                <span>XP</span>
                <strong>{profile.xp}</strong>
              </div>
              <div>
                <span>Streak</span>
                <strong>{profile.streak}</strong>
              </div>
              <div>
                <span>Opgaver</span>
                <strong>{profile.puzzlesSolved}</strong>
              </div>
            </div>
            <p className="heroProgressNote">
              {hasProgress
                ? `Du mangler ${xpRemaining} XP til niveau ${profile.level + 1}.`
                : 'Din lokale profil bliver synlig, så snart du spiller eller løser en opgave.'}
            </p>
            {hasProgress ? (
              <div className="progressBlock">
                <div className="progressMeta">
                  <span>Progression i nuværende niveau</span>
                  <strong>
                    {xpInLevel}/{xpToNextLevel} XP
                  </strong>
                </div>
                <div className="progressTrack" aria-hidden="true">
                  <div className="progressFill" style={{ width: `${(xpInLevel / xpToNextLevel) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="starterSteps">
                <div>
                  <strong>1</strong>
                  <span>Spil et parti mod computeren</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>Løs en taktisk opgave</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>Følg din streak og XP i profilen</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Træningsområder"
          title="Vælg din næste session"
          description="SkakCoach v2 er bygget som et samlet træningsrum, hvor spil, taktik og progression hænger sammen."
        />
        <div className="featureGrid">
          {featureCards.map((feature) => (
            <Card
              key={feature.title}
              badge={feature.badge}
              description={feature.description}
              href={feature.href}
              eyebrow={feature.eyebrow}
              title={feature.title}
            >
              <div className="featureCardFooter">
                <span>{feature.detail}</span>
                <strong>{feature.badge === 'Klar nu' ? 'Åbn modul' : 'Se preview'}</strong>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="homeSplitGrid">
        <Card
          badge="Dagens fokus"
          className="challengeCard"
          description="En enkel rutine, der holder træningen i gang uden at gøre siden tung."
          eyebrow="Dagens udfordring"
          title="Lille plan, stor effekt"
        >
          <ul className="challengeList">
            {dailyChallenge.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="challengeNote">Et kort dagligt loop er nok til at holde både blik og streak skarpe.</p>
        </Card>

        <Card
          badge={hasProgress ? 'Aktiv profil' : 'Ingen historik endnu'}
          description={
            hasProgress
              ? 'Din træning er allerede i gang. Brug profilen som pejlemærke, ikke som pynt.'
              : 'Når du har spillet eller løst din første opgave, dukker din progression op her.'
          }
          eyebrow="Status lige nu"
          title="Kort oversigt"
        >
          {hasProgress ? (
            <div className="miniSummaryGrid">
              <StatCard accent="gold" label="Level" value={profile.level} />
              <StatCard accent="blue" label="XP" value={profile.xp} />
              <StatCard accent="green" label="Sejre" value={profile.gamesWon} />
            </div>
          ) : (
            <div className="summaryEmptyState">
              <p>Ingen historik endnu. Start med ét parti eller én opgave, så tænder progressionen her.</p>
              <div className="summaryEmptyActions">
                <Button href="/play" variant="secondary">
                  Spil første parti
                </Button>
                <Button href="/tactics" variant="ghost">
                  Løs første opgave
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <section>
        <SectionTitle
          eyebrow="Din progression"
          title="Overblik over din træning"
          description="Hvis du allerede har lokale data, kan du se dem her med det samme."
        />
        <div className="statsGrid">
          <StatCard accent="gold" label="Level" value={profile.level} hint="Udregnes automatisk fra XP." />
          <StatCard accent="blue" label="XP" value={profile.xp} hint="Optjenes via partier og opgaver." />
          <StatCard accent="green" label="Streak" value={profile.streak} hint="Træningsdage i træk." />
          <StatCard label="Opgaver løst" value={profile.puzzlesSolved} hint="Korrekte taktiske løsninger." />
          <StatCard label="Partier vundet" value={profile.gamesWon} hint="Sejre mod computeren." />
          <StatCard label="Partier spillet" value={profile.gamesPlayed} hint="Alle afsluttede partier." />
        </div>
      </section>
    </main>
  );
}
