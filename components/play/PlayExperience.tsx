'use client';

import type { Route } from 'next';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { Chess, type Color, type Move } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import CoachPanel from '@/components/CoachPanel';
import EvalBar from '@/components/EvalBar';
import GameInfo from '@/components/GameInfo';
import MoveHistory from '@/components/MoveHistory';
import SettingsPanel from '@/components/SettingsPanel';
import PageHeader from '@/components/layout/PageHeader';
import AfterGameReviewPanel from '@/components/play/AfterGameReviewPanel';
import OpeningContextPanel from '@/components/play/OpeningContextPanel';
import PlayControlBar from '@/components/play/PlayControlBar';
import Button from '@/components/ui/Button';
import { getOpeningBySlug, type Opening } from '@/data/openings/openings';
import {
  buildPreMoveCoach,
  explainMove,
  type MoveExplanation,
  type PreMoveCoach,
} from '@/lib/explainMove';
import { applyUciMove, uciToSan } from '@/lib/chessHelpers';
import { useEngine } from '@/lib/engine/useEngine';
import {
  getOpeningSideChoice,
  getOpeningTheoryState,
  type OpeningTheoryState,
} from '@/lib/openings/openingTheoryHelpers';
import { recordOpeningPlaySession } from '@/lib/openings/openingProgressHelpers';
import { updateOpeningsProgress } from '@/lib/openings/openingProgressStorage';
import { recordCompletedGame } from '@/lib/profile/profileHelpers';
import { updateProfile } from '@/lib/profile/profileStorage';
import {
  buildAfterGameReview,
  type PlayerMoveReviewRecord,
} from '@/lib/review/gameReview';

type PlayerSideChoice = 'white' | 'black' | 'random';
type Difficulty = 'let' | 'mellem' | 'svaer';
type Tempo = 'hurtig' | 'normal' | 'rolig';
type BoardThemeKey = 'classic' | 'forest' | 'ocean';
type StoredSettings = {
  difficulty: Difficulty;
  tempo: Tempo;
  theme: BoardThemeKey;
  showEvalBar: boolean;
  showCoordinates: boolean;
  voiceEnabled: boolean;
};

const SETTINGS_KEY = 'skakcoach-settings';

const difficultyDepth: Record<Difficulty, number> = {
  let: 8,
  mellem: 12,
  svaer: 15,
};

const tempoDelay: Record<Tempo, number> = {
  hurtig: 250,
  normal: 600,
  rolig: 1200,
};

const boardThemes: Record<
  BoardThemeKey,
  { light: string; dark: string; highlight: string; outline: string }
> = {
  classic: {
    light: '#f3efe6',
    dark: '#8ea1b5',
    highlight: 'rgba(246, 246, 105, 0.82)',
    outline: '#c18b1d',
  },
  forest: {
    light: '#edf2e3',
    dark: '#5f7d5c',
    highlight: 'rgba(152, 243, 169, 0.78)',
    outline: '#2e5f34',
  },
  ocean: {
    light: '#eef5fb',
    dark: '#5d84b6',
    highlight: 'rgba(121, 202, 255, 0.78)',
    outline: '#1f5f99',
  },
};

const defaultExplanation: MoveExplanation = {
  classification: 'Afventer træk',
  advantage: 'Vælg side og tryk Start parti, når du er klar.',
  drawback: 'Ingen vurdering endnu.',
  betterMove: 'Du kan ændre tema, tempo og styrke før du starter.',
};

function resolvePlayerColor(choice: PlayerSideChoice): Color {
  if (choice === 'random') {
    return Math.random() < 0.5 ? 'w' : 'b';
  }

  return choice === 'white' ? 'w' : 'b';
}

function getPreviewColor(choice: PlayerSideChoice): Color {
  if (choice === 'black') return 'b';
  return 'w';
}

function playFallbackReply(game: Chess): Move | null {
  const replies = game.moves({ verbose: true });
  if (replies.length === 0) return null;

  const reply = replies[Math.floor(Math.random() * replies.length)];
  return game.move({
    from: reply.from,
    to: reply.to,
    promotion: reply.promotion ?? 'q',
  });
}

function getSetupCoach(choice: PlayerSideChoice): PreMoveCoach {
  return {
    suggestedMoves: [],
    summary: 'Tryk Start parti for at begynde.',
    plan:
      choice === 'random'
        ? 'Vælg gerne tema og sværhedsgrad først. Farven vælges, når partiet starter.'
        : 'Du kan vælge tema, tempo og styrke, før partiet går i gang.',
    caution: '',
  };
}

function getPendingCoach(playerColor: Color): PreMoveCoach {
  return {
    suggestedMoves: [],
    summary: 'Jeg analyserer de bedste træk for dig.',
    plan:
      playerColor === 'w'
        ? 'Du starter partiet. Vent et øjeblik og se coachens forslag før du rykker.'
        : 'Computeren starter som hvid. Derefter viser coachen de bedste svar for dig.',
    caution: '',
  };
}

function getComputerThinkingCoach(): PreMoveCoach {
  return {
    suggestedMoves: [],
    summary: 'Computeren overvejer sit svar.',
    plan: 'Så snart modstanderen har rykket, opdaterer coachen dine bedste muligheder.',
    caution: '',
  };
}

function getGameOverCoach(): PreMoveCoach {
  return {
    suggestedMoves: [],
    summary: 'Partiet er slut.',
    plan: 'Tryk Nyt parti for at starte igen med den valgte side.',
    caution: '',
  };
}

function getFallbackPreMoveCoach(): PreMoveCoach {
  return {
    suggestedMoves: [],
    summary: 'Jeg kunne ikke hente nye forslag lige nu.',
    plan: 'Spil enkelt: udvikl dine officerer, kæmp om centrum og rokér i god tid.',
    caution: '',
  };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractSuggestedMoves(
  fen: string,
  topMoves: Array<{ move?: string }>,
): string[] {
  return topMoves
    .map((line) => (line.move ? uciToSan(new Chess(fen), line.move) : undefined))
    .filter((move): move is string => Boolean(move));
}

function cloneGameWithHistory(source: Chess): Chess {
  const clone = new Chess();
  const pgn = source.pgn();

  if (pgn.trim()) {
    clone.loadPgn(pgn);
    return clone;
  }

  clone.load(source.fen());
  return clone;
}

function buildExplanationSpeech(explanation: MoveExplanation): string {
  return [
    `Vurdering: ${explanation.classification}.`,
    `Fordel: ${explanation.advantage}`,
    `Ulempe: ${explanation.drawback}`,
    `Bedre mulighed: ${explanation.betterMove}`,
  ].join(' ');
}

function buildPreMoveSpeech(preMoveCoach: PreMoveCoach): string {
  const suggestedMoves =
    preMoveCoach.suggestedMoves.length > 0
      ? `Forslagene er: ${preMoveCoach.suggestedMoves.join(', ')}.`
      : '';

  return [preMoveCoach.summary, suggestedMoves, preMoveCoach.plan, preMoveCoach.caution]
    .filter(Boolean)
    .join(' ');
}

function isStoredSettings(value: unknown): value is StoredSettings {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<StoredSettings>;
  return (
    (candidate.difficulty === 'let' ||
      candidate.difficulty === 'mellem' ||
      candidate.difficulty === 'svaer') &&
    (candidate.tempo === 'hurtig' || candidate.tempo === 'normal' || candidate.tempo === 'rolig') &&
    (candidate.theme === 'classic' || candidate.theme === 'forest' || candidate.theme === 'ocean') &&
    typeof candidate.showEvalBar === 'boolean' &&
    typeof candidate.showCoordinates === 'boolean' &&
    typeof candidate.voiceEnabled === 'boolean'
  );
}

type Props = {
  openingSlug?: string;
};

function getOpeningStatusLabel(
  theoryState: OpeningTheoryState | null,
  hasStarted: boolean,
): string | null {
  if (!theoryState) return null;
  if (!hasStarted) return 'Åbning klar';
  if (theoryState.hasLeftTheory) return 'Ude af teori';
  if (theoryState.isComplete) return 'Starterlinje færdig';
  return `Teori ${theoryState.matchedMoves}/${theoryState.totalMoves}`;
}

function getOpeningBoardNote(
  theoryState: OpeningTheoryState | null,
  hasStarted: boolean,
): string | null {
  if (!theoryState) return null;
  if (!hasStarted) return 'Åbningstræningen følger starterlinjen fra første træk.';
  if (theoryState.hasLeftTheory) {
    return 'Nu er du ude af den kendte teori. SkakCoach skifter til almindelig parti-coach.';
  }
  if (theoryState.isComplete) {
    return 'Starterlinjen er gennemført. Partiet fortsætter nu som almindelig træning.';
  }
  return `Du er stadig i teorien: ${theoryState.matchedMoves}/${theoryState.totalMoves} træk matcher linjen.`;
}

function getCoachStatusLabel(
  hasStarted: boolean,
  isComputerThinking: boolean,
  isPreparingCoach: boolean,
  isGameOver: boolean,
): string {
  if (!hasStarted) return 'Coach klar ved start';
  if (isGameOver) return 'Partiet er slut';
  if (isComputerThinking) return 'Computeren tænker';
  if (isPreparingCoach) return 'Coach analyserer';
  return 'Coach klar til dit træk';
}

function getTheoryReply(
  opening: Opening | undefined,
  historyVerbose: Move[],
): { san: string | null; uci: string } | null {
  if (!opening) {
    return null;
  }

  const theoryState = getOpeningTheoryState(opening, historyVerbose);
  if (!theoryState.isInTheory || !theoryState.nextExpectedMoveUci) {
    return null;
  }

  return {
    san: theoryState.nextExpectedMoveSan,
    uci: theoryState.nextExpectedMoveUci,
  };
}

export default function PlayExperience({ openingSlug }: Props) {
  const [game, setGame] = useState(() => new Chess());
  const [hasStarted, setHasStarted] = useState(false);
  const [coachText, setCoachText] = useState<MoveExplanation>(defaultExplanation);
  const [preMoveCoach, setPreMoveCoach] = useState<PreMoveCoach>(() => getSetupCoach('white'));
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isPreparingCoach, setIsPreparingCoach] = useState(false);
  const [playerSideChoice, setPlayerSideChoice] = useState<PlayerSideChoice>('white');
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [currentEvaluation, setCurrentEvaluation] = useState<number | null>(null);
  const [lastEngineMove, setLastEngineMove] = useState<[string, string] | null>(null);
  const [playerMoveReviews, setPlayerMoveReviews] = useState<PlayerMoveReviewRecord[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('mellem');
  const [tempo, setTempo] = useState<Tempo>('normal');
  const [theme, setTheme] = useState<BoardThemeKey>('classic');
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const playerSideChoiceRef = useRef<PlayerSideChoice>('white');
  const openingPracticeRecordedRef = useRef(false);
  const settingsLoadedRef = useRef(false);
  const lastSpokenMessageRef = useRef('');
  const coachFenRef = useRef('');
  const computerFenRef = useRef('');
  const completedGameFenRef = useRef('');
  const computerTaskIdRef = useRef(0);
  const isComputerThinkingRef = useRef(false);
  const { analyzeFen, isReady } = useEngine();
  const opening = openingSlug ? getOpeningBySlug(openingSlug) : undefined;
  const openingSideChoice = opening ? getOpeningSideChoice(opening) : null;
  const historyVerbose = game.history({ verbose: true }) as Move[];

  const boardTheme = boardThemes[theme];
  const analysisDepth = difficultyDepth[difficulty];
  const moveDelay = tempoDelay[tempo];
  const openingTheoryState = opening ? getOpeningTheoryState(opening, historyVerbose) : null;
  const openingStatusLabel = getOpeningStatusLabel(openingTheoryState, hasStarted);
  const openingBoardNote = getOpeningBoardNote(openingTheoryState, hasStarted);
  const coachStatusLabel = getCoachStatusLabel(
    hasStarted,
    isComputerThinking,
    isPreparingCoach,
    game.isGameOver(),
  );
  const boardDisabled =
    !hasStarted || !isReady || isComputerThinking || game.turn() !== playerColor || game.isGameOver();
  const openingHref = opening ? (`/openings/${opening.slug}` as Route) : null;
  const lockedSideReason = opening
    ? `Du øver ${opening.name} og spiller derfor ${opening.side}. Start et frit parti uden valgt åbning for selv at vælge side.`
    : null;
  const afterGameReview =
    hasStarted && game.isGameOver()
      ? buildAfterGameReview({
          game,
          historyVerbose,
          opening,
          playerColor,
          playerMoveReviews,
        })
      : null;
  const lastEngineMoveStyles: Record<string, CSSProperties> =
    lastEngineMove === null
      ? {}
      : {
          [lastEngineMove[0]]: {
            backgroundColor: boardTheme.highlight,
            boxShadow: `inset 0 0 0 3px ${boardTheme.outline}`,
            animation: 'moveBlink 0.9s ease-in-out 2',
          },
          [lastEngineMove[1]]: {
            backgroundColor: boardTheme.highlight,
            boxShadow: `inset 0 0 0 3px ${boardTheme.outline}`,
            animation: 'moveBlink 0.9s ease-in-out 2',
          },
        };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isStoredSettings(parsed)) return;

      setDifficulty(parsed.difficulty);
      setTempo(parsed.tempo);
      setTheme(parsed.theme);
      setShowEvalBar(parsed.showEvalBar);
      setShowCoordinates(parsed.showCoordinates);
      setVoiceEnabled(parsed.voiceEnabled);
    } catch {
      // Ignore malformed local settings and keep defaults.
    } finally {
      settingsLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
    setVoiceSupported(supported);

    if (!supported) return;

    const synth = window.speechSynthesis;
    const handleVoicesChanged = () => {
      synth.getVoices();
    };

    handleVoicesChanged();
    synth.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      synth.cancel();
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;

    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        difficulty,
        tempo,
        theme,
        showEvalBar,
        showCoordinates,
        voiceEnabled,
      } satisfies StoredSettings),
    );
  }, [difficulty, showCoordinates, showEvalBar, tempo, theme, voiceEnabled]);

  const recordOpeningPracticeIfNeeded = useCallback(() => {
    if (!opening || openingPracticeRecordedRef.current) {
      return;
    }

    openingPracticeRecordedRef.current = true;
    updateOpeningsProgress((current) => recordOpeningPlaySession(current, opening.slug));
  }, [opening]);

  const setComputerThinking = useCallback((value: boolean) => {
    isComputerThinkingRef.current = value;
    setIsComputerThinking(value);
  }, []);

  useEffect(() => {
    computerTaskIdRef.current += 1;
    const nextChoice = openingSideChoice ?? 'white';
    const previewColor = getPreviewColor(nextChoice);
    coachFenRef.current = '';
    computerFenRef.current = '';
    completedGameFenRef.current = '';
    lastSpokenMessageRef.current = '';
    playerSideChoiceRef.current = nextChoice;
    openingPracticeRecordedRef.current = false;
    setPlayerSideChoice(nextChoice);
    setPlayerColor(previewColor);
    setHasStarted(false);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getSetupCoach(nextChoice));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setPlayerMoveReviews([]);
    setIsPreparingCoach(false);
    setComputerThinking(false);
  }, [openingSideChoice, setComputerThinking]);

  const cancelPendingComputerMove = useCallback(() => {
    computerTaskIdRef.current += 1;
    computerFenRef.current = '';
    setComputerThinking(false);
  }, [setComputerThinking]);

  const speakText = useCallback(
    (text: string) => {
      if (!voiceSupported || typeof window === 'undefined' || !text.trim()) return;

      const synth = window.speechSynthesis;
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'da-DK';

      const voices = synth.getVoices();
      const danishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('da'));
      if (danishVoice) {
        utterance.voice = danishVoice;
      }

      synth.cancel();
      synth.speak(utterance);
    },
    [voiceSupported],
  );

  useEffect(() => {
    if (!hasStarted || !voiceEnabled || !voiceSupported) return;
    if (coachText.classification === 'Afventer træk') return;

    const message = buildExplanationSpeech(coachText);
    if (lastSpokenMessageRef.current === message) return;

    lastSpokenMessageRef.current = message;
    speakText(message);
  }, [coachText, hasStarted, speakText, voiceEnabled, voiceSupported]);

  const handleReadCoachAloud = useCallback(() => {
    const parts = [];

    if (preMoveCoach.summary) {
      parts.push(`Før dit træk. ${buildPreMoveSpeech(preMoveCoach)}`);
    }

    if (hasStarted && coachText.classification !== 'Afventer træk') {
      parts.push(`Seneste vurdering. ${buildExplanationSpeech(coachText)}`);
    }

    if (parts.length === 0) {
      parts.push(buildExplanationSpeech(defaultExplanation));
    }

    speakText(parts.join(' '));
  }, [coachText, hasStarted, preMoveCoach, speakText]);

  useEffect(() => {
    if (!hasStarted || !isReady || isComputerThinkingRef.current) return;

    const currentFen = game.fen();

    if (game.isGameOver()) {
      setIsPreparingCoach(false);
      setPreMoveCoach(getGameOverCoach());
      coachFenRef.current = currentFen;
      computerFenRef.current = '';
      return;
    }

    if (game.turn() !== playerColor) {
      if (computerFenRef.current === currentFen || isComputerThinkingRef.current) return;

      const taskId = computerTaskIdRef.current + 1;
      computerTaskIdRef.current = taskId;
      computerFenRef.current = currentFen;
      coachFenRef.current = '';
      setIsPreparingCoach(false);
      setComputerThinking(true);
      setPreMoveCoach(getComputerThinkingCoach());

      void (async () => {
        const next = new Chess(currentFen);

        try {
          const theoryReply = getTheoryReply(opening, game.history({ verbose: true }) as Move[]);

          if (theoryReply) {
            await delay(Math.min(moveDelay, 500));
            if (computerTaskIdRef.current !== taskId) return;

            const theoryMove = applyUciMove(next, theoryReply.uci);
            if (theoryMove) {
              recordOpeningPracticeIfNeeded();
              setLastEngineMove([theoryMove.from, theoryMove.to]);
              return;
            }
          }

          const analysis = await analyzeFen(currentFen, analysisDepth);
          if (computerTaskIdRef.current !== taskId) return;

          if (analysis.bestMove) {
            await delay(moveDelay);
            if (computerTaskIdRef.current !== taskId) return;
            const applied = applyUciMove(next, analysis.bestMove);
            if (applied) {
              recordOpeningPracticeIfNeeded();
              setLastEngineMove([applied.from, applied.to]);
            } else {
              const fallback = playFallbackReply(next);
              if (fallback) {
                recordOpeningPracticeIfNeeded();
                setLastEngineMove([fallback.from, fallback.to]);
              }
            }
          } else {
            const fallback = playFallbackReply(next);
            if (fallback) {
              recordOpeningPracticeIfNeeded();
              setLastEngineMove([fallback.from, fallback.to]);
            }
          }
        } catch {
          if (computerTaskIdRef.current !== taskId) return;
          const fallback = playFallbackReply(next);
          if (fallback) {
            recordOpeningPracticeIfNeeded();
            setLastEngineMove([fallback.from, fallback.to]);
          }
        } finally {
          if (computerTaskIdRef.current === taskId) {
            computerFenRef.current = '';
            setGame(cloneGameWithHistory(next));
            setComputerThinking(false);
          }
        }
      })();

      return;
    }

    if (coachFenRef.current === currentFen) return;

    let cancelled = false;
    coachFenRef.current = currentFen;
    computerFenRef.current = '';
    setIsPreparingCoach(true);
    setPreMoveCoach(getPendingCoach(playerColor));

    void (async () => {
      try {
        const analysis = await analyzeFen(currentFen, analysisDepth, 3);
        if (cancelled) return;

        setCurrentEvaluation(analysis.evaluation);
        setPreMoveCoach(
          buildPreMoveCoach({
            position: new Chess(currentFen),
            playerColor,
            suggestedMoves: extractSuggestedMoves(currentFen, analysis.topMoves),
          }),
        );
      } catch {
        if (!cancelled) {
          setPreMoveCoach(getFallbackPreMoveCoach());
        }
      } finally {
        if (!cancelled) {
          setIsPreparingCoach(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    analyzeFen,
    analysisDepth,
    game,
    hasStarted,
    isReady,
    moveDelay,
    opening,
    playerColor,
    recordOpeningPracticeIfNeeded,
    setComputerThinking,
  ]);

  useEffect(() => {
    if (!hasStarted || !game.isGameOver()) return;

    const currentFen = game.fen();
    if (completedGameFenRef.current === currentFen) return;

    completedGameFenRef.current = currentFen;
    const playerWon = game.isCheckmate() && game.turn() !== playerColor;
    updateProfile((current) => recordCompletedGame(current, playerWon));
  }, [game, hasStarted, playerColor]);

  async function onPlayerMove(from: string, to: string) {
    if (!hasStarted || !isReady || isComputerThinking || game.turn() !== playerColor || game.isGameOver()) {
      return false;
    }

    const before = new Chess(game.fen());
    const afterPlayerMove = new Chess(game.fen());
    let move = null;

    try {
      move = afterPlayerMove.move({ from, to, promotion: 'q' });
    } catch {
      move = null;
    }

    if (!move) return false;

    recordOpeningPracticeIfNeeded();
    setGame(cloneGameWithHistory(afterPlayerMove));
    setIsPreparingCoach(false);
    setComputerThinking(true);
    setLastEngineMove(null);
    coachFenRef.current = '';
    computerFenRef.current = '';
    setPreMoveCoach({
      suggestedMoves: [],
      summary: 'Jeg vurderer dit træk.',
      plan: 'Om lidt får du feedback på trækket og derefter nye forslag til næste tur.',
      caution: '',
    });

    try {
      const beforeAnalysis = await analyzeFen(before.fen(), analysisDepth, 3);
      const afterAnalysis = await analyzeFen(afterPlayerMove.fen(), analysisDepth);
      const suggestedMovesBefore = extractSuggestedMoves(before.fen(), beforeAnalysis.topMoves);
      const theoryReply = getTheoryReply(
        opening,
        afterPlayerMove.history({ verbose: true }) as Move[],
      );
      const opponentReplySan = theoryReply?.san ?? uciToSan(afterPlayerMove, afterAnalysis.bestMove);
      const engineBestMoveSan = uciToSan(before, beforeAnalysis.bestMove) ?? suggestedMovesBefore[0];
      const movePly = before.history().length + 1;
      const explanation = explainMove({
        move,
        before,
        after: afterPlayerMove,
        history: before.history(),
        historyVerbose: before.history({ verbose: true }) as Move[],
        playerColor,
        engineBestMoveSan,
        opponentBestReplySan: opponentReplySan,
        evalBeforeCp: beforeAnalysis.evaluation,
        evalAfterCp: afterAnalysis.evaluation,
      });

      setCurrentEvaluation(afterAnalysis.evaluation);
      setCoachText(explanation);
      setPlayerMoveReviews((current) => [
        ...current,
        {
          ply: movePly,
          san: move.san,
          classification: explanation.classification,
          evalBeforeCp: beforeAnalysis.evaluation,
          evalAfterCp: afterAnalysis.evaluation,
          engineBestMoveSan,
          opponentBestReplySan: opponentReplySan,
        },
      ]);

      if (!afterPlayerMove.isGameOver()) {
        await delay(moveDelay);
        if (theoryReply) {
          const appliedTheoryMove = applyUciMove(afterPlayerMove, theoryReply.uci);
          if (appliedTheoryMove) {
            setLastEngineMove([appliedTheoryMove.from, appliedTheoryMove.to]);
          } else if (afterAnalysis.bestMove) {
            const applied = applyUciMove(afterPlayerMove, afterAnalysis.bestMove);
            if (applied) {
              setLastEngineMove([applied.from, applied.to]);
            } else {
              const fallback = playFallbackReply(afterPlayerMove);
              if (fallback) {
                setLastEngineMove([fallback.from, fallback.to]);
              }
            }
          } else {
            const fallback = playFallbackReply(afterPlayerMove);
            if (fallback) {
              setLastEngineMove([fallback.from, fallback.to]);
            }
          }
        } else if (afterAnalysis.bestMove) {
          const applied = applyUciMove(afterPlayerMove, afterAnalysis.bestMove);
          if (applied) {
            setLastEngineMove([applied.from, applied.to]);
          } else {
            const fallback = playFallbackReply(afterPlayerMove);
            if (fallback) {
              setLastEngineMove([fallback.from, fallback.to]);
            }
          }
        } else {
          const fallback = playFallbackReply(afterPlayerMove);
          if (fallback) {
            setLastEngineMove([fallback.from, fallback.to]);
          }
        }
      }

      setGame(cloneGameWithHistory(afterPlayerMove));
      return true;
    } catch {
      if (!afterPlayerMove.isGameOver()) {
        await delay(Math.max(200, moveDelay - 150));
        const theoryReply = getTheoryReply(
          opening,
          afterPlayerMove.history({ verbose: true }) as Move[],
        );

        if (theoryReply) {
          const appliedTheoryMove = applyUciMove(afterPlayerMove, theoryReply.uci);
          if (appliedTheoryMove) {
            setLastEngineMove([appliedTheoryMove.from, appliedTheoryMove.to]);
          } else {
            const fallback = playFallbackReply(afterPlayerMove);
            if (fallback) {
              setLastEngineMove([fallback.from, fallback.to]);
            }
          }
        } else {
          const fallback = playFallbackReply(afterPlayerMove);
          if (fallback) {
            setLastEngineMove([fallback.from, fallback.to]);
          }
        }
      }

      const movePly = before.history().length + 1;
      const explanation = explainMove({
        move,
        before,
        after: afterPlayerMove,
        history: before.history(),
        historyVerbose: before.history({ verbose: true }) as Move[],
        playerColor,
      });
      setCoachText(explanation);
      setPlayerMoveReviews((current) => [
        ...current,
        {
          ply: movePly,
          san: move.san,
          classification: explanation.classification,
          evalBeforeCp: null,
          evalAfterCp: null,
        },
      ]);
      setGame(cloneGameWithHistory(afterPlayerMove));
      return true;
    } finally {
      setComputerThinking(false);
    }
  }

  function prepareGame(nextChoice = playerSideChoice) {
    cancelPendingComputerMove();
    const previewColor = getPreviewColor(nextChoice);
    coachFenRef.current = '';
    computerFenRef.current = '';
    lastSpokenMessageRef.current = '';
    completedGameFenRef.current = '';
    playerSideChoiceRef.current = nextChoice;
    openingPracticeRecordedRef.current = false;
    setPlayerSideChoice(nextChoice);
    setPlayerColor(previewColor);
    setHasStarted(false);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getSetupCoach(nextChoice));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setPlayerMoveReviews([]);
    setIsPreparingCoach(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function startGame() {
    cancelPendingComputerMove();
    const nextSideChoice = openingSideChoice ?? playerSideChoiceRef.current;
    const nextPlayerColor = openingSideChoice
      ? getPreviewColor(openingSideChoice)
      : resolvePlayerColor(nextSideChoice);
    coachFenRef.current = '';
    computerFenRef.current = '';
    lastSpokenMessageRef.current = '';
    completedGameFenRef.current = '';
    playerSideChoiceRef.current = nextSideChoice;
    openingPracticeRecordedRef.current = false;
    setPlayerSideChoice(nextSideChoice);
    setPlayerColor(nextPlayerColor);
    setHasStarted(true);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getPendingCoach(nextPlayerColor));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setPlayerMoveReviews([]);
    setIsPreparingCoach(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  return (
    <div className="playPage">
      <PageHeader
        className="pageHeaderCompact"
        eyebrow={opening ? 'Åbningsspil mod computeren' : 'Spil mod computeren'}
        title="Spil, forstå og forbedr dig"
        description={
          opening
            ? `Du øver ${opening.name}. Start ved brættet, følg den kendte teori og fortsæt derefter med almindelig parti-coach.`
            : 'Start hurtigt ved brættet, få forslag før dit træk og kompakt feedback undervejs.'
        }
        actions={
          opening && openingHref ? (
            <>
              <Button href={openingHref} variant="secondary">
                Til åbningen
              </Button>
              <Button href="/play" variant="ghost">
                Frit parti
              </Button>
            </>
          ) : (
            <>
              <Button href="/tactics" variant="secondary">
                Træn taktik først
              </Button>
              <Button href="/profile" variant="ghost">
                Se min profil
              </Button>
            </>
          )
        }
      />

      <div className="page playLayout">
        <section className="boardColumn">
          <PlayControlBar
            coachStatus={coachStatusLabel}
            hasStarted={hasStarted}
            isReady={isReady}
            isComputerThinking={isComputerThinking}
            lockedSideReason={lockedSideReason}
            openingStatus={openingStatusLabel}
            playerColor={playerColor}
            sideChoice={playerSideChoice}
            onSideChange={prepareGame}
            onStartGame={startGame}
          />

          <div className="boardPanel">
            <div className="boardStage">
              <ChessBoard
                position={game.fen()}
                onMove={onPlayerMove}
                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                disabled={boardDisabled}
                darkSquareColor={boardTheme.dark}
                lightSquareColor={boardTheme.light}
                customSquareStyles={lastEngineMoveStyles}
                showBoardNotation={showCoordinates}
              />

              <div className="boardMeta">
                {!isReady && <p className="statusNote">Stockfish starter…</p>}
                {!hasStarted && isReady && <p className="statusNote">Tryk Start parti for at begynde.</p>}
                {isComputerThinking && <p className="thinking">Computeren tænker…</p>}
                {afterGameReview ? <p className="statusNote">Partiet er slut. Reviewet ligger lige under brættet.</p> : null}
                {openingBoardNote ? (
                  <p
                    className={`statusNote${openingTheoryState?.hasLeftTheory ? ' statusNoteWarning' : ''}`}
                  >
                    {openingBoardNote}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {afterGameReview ? <AfterGameReviewPanel review={afterGameReview} /> : null}
        </section>

        <aside className="sideColumn">
          {opening && openingTheoryState ? (
            <OpeningContextPanel
              hasStarted={hasStarted}
              opening={opening}
              theoryState={openingTheoryState}
            />
          ) : null}
          <CoachPanel
            explanation={coachText}
            preMoveCoach={preMoveCoach}
            isPreparing={isPreparingCoach}
            voiceSupported={voiceSupported}
            onReadAloud={handleReadCoachAloud}
          />
          <GameInfo
            game={game}
            hasStarted={hasStarted}
            openingName={opening?.name}
            playerColor={playerColor}
          />
          <EvalBar evaluation={currentEvaluation} visible={showEvalBar} />
          <MoveHistory moves={game.history()} />
          <SettingsPanel
            difficulty={difficulty}
            tempo={tempo}
            theme={theme}
            showEvalBar={showEvalBar}
            showCoordinates={showCoordinates}
            voiceEnabled={voiceEnabled}
            voiceSupported={voiceSupported}
            onDifficultyChange={setDifficulty}
            onTempoChange={setTempo}
            onThemeChange={setTheme}
            onShowEvalBarChange={setShowEvalBar}
            onShowCoordinatesChange={setShowCoordinates}
            onVoiceEnabledChange={setVoiceEnabled}
          />
        </aside>
      </div>
    </div>
  );
}
