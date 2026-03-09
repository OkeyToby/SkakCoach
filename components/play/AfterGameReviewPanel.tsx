'use client';

import AccordionPanel from '@/components/AccordionPanel';
import type { AfterGameReview } from '@/lib/review/gameReview';

type Props = {
  review: AfterGameReview;
};

function getToneClassName(tone: AfterGameReview['resultTone']): string {
  if (tone === 'win') return 'afterGameReviewToneWin';
  if (tone === 'loss') return 'afterGameReviewToneLoss';
  return 'afterGameReviewToneDraw';
}

export default function AfterGameReviewPanel({ review }: Props) {
  return (
    <AccordionPanel
      defaultOpen={true}
      summaryValue={`${review.resultLabel}, +${review.xpGained} XP`}
      title="Parti-review"
    >
      <div className={`afterGameReview ${getToneClassName(review.resultTone)}`}>
        <div className="afterGameReviewHeader">
          <div className="afterGameReviewHeaderContent">
            <span className="cardEyebrow">Efter partiet</span>
            <h3>{review.resultLabel}</h3>
            <p className="cardDescription">{review.resultDetail}</p>
          </div>
          <div className="afterGameReviewXp">
            <strong>+{review.xpGained} XP</strong>
            <span>Lagt på din profil</span>
          </div>
        </div>

        <div className="afterGameReviewStats">
          <div className="afterGameReviewStat">
            <span>Resultat</span>
            <strong>{review.resultLabel}</strong>
          </div>
          {review.openingName ? (
            <div className="afterGameReviewStat">
              <span>Åbning</span>
              <strong>{review.openingName}</strong>
            </div>
          ) : null}
          {review.theoryLabel ? (
            <div className="afterGameReviewStat">
              <span>Teori</span>
              <strong>{review.theoryLabel}</strong>
            </div>
          ) : null}
          {review.theoryExitLabel ? (
            <div className="afterGameReviewStat">
              <span>Første afvigelse</span>
              <strong>{review.theoryExitLabel}</strong>
            </div>
          ) : null}
        </div>

        <div className="afterGameReviewSections">
          {review.theorySummary ? (
            <div className="afterGameReviewNote">
              <span className="afterGameReviewSectionLabel">Åbningsforløb</span>
              <p>{review.theorySummary}</p>
            </div>
          ) : null}

          <div className="afterGameReviewTurningPoint">
            <span className="afterGameReviewSectionLabel">Nøglemoment</span>
            <strong>{review.turningPointTitle}</strong>
            <p>{review.turningPointDescription}</p>
          </div>
        </div>

        <div className="afterGameReviewTakeaways">
          <span className="afterGameReviewSectionLabel">Næste fokus</span>
          <strong>3 korte ting at tage med</strong>
          <ol className="afterGameReviewTakeawayList">
            {review.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ol>
        </div>
      </div>
    </AccordionPanel>
  );
}
