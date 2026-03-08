'use client';

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { Chess, type Color, type Move } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import CoachPanel from '@/components/CoachPanel';
import EvalBar from '@/components/EvalBar';
import GameInfo from '@/components/GameInfo';
import MoveHistory from '@/components/MoveHistory';
import SettingsPanel from '@/components/SettingsPanel';
import {
  buildPreMoveCoach,
  explainMove,
  type MoveExplanation,
  type PreMoveCoach,
} from '@/lib/explainMove';
import { applyUciMove, uciToSan } from '@/lib/chessHelpers';
import { useEngine } from '@/lib/engine/useEngine';

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

export default function Page() {
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
  const [difficulty, setDifficulty] = useState<Difficulty>('mellem');
  const [tempo, setTempo] = useState<Tempo>('normal');
  const [theme, setTheme] = useState<BoardThemeKey>('classic');
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const settingsLoadedRef = useRef(false);
  const lastSpokenMessageRef = useRef('');
  const coachFenRef = useRef('');
  const computerFenRef = useRef('');
  const computerTaskIdRef = useRef(0);
  const isComputerThinkingRef = useRef(false);
  const { analyzeFen, isReady } = useEngine();

  const boardTheme = boardThemes[theme];
  const analysisDepth = difficultyDepth[difficulty];
  const moveDelay = tempoDelay[tempo];
  const boardDisabled =
    !hasStarted || !isReady || isComputerThinking || game.turn() !== playerColor || game.isGameOver();
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

  const setComputerThinking = useCallback((value: boolean) => {
    isComputerThinkingRef.current = value;
    setIsComputerThinking(value);
  }, []);

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
          const analysis = await analyzeFen(currentFen, analysisDepth);
          if (computerTaskIdRef.current !== taskId) return;

          if (analysis.bestMove) {
            await delay(moveDelay);
            if (computerTaskIdRef.current !== taskId) return;
            const applied = applyUciMove(next, analysis.bestMove);
            if (applied) {
              setLastEngineMove([applied.from, applied.to]);
            } else {
              const fallback = playFallbackReply(next);
              if (fallback) {
                setLastEngineMove([fallback.from, fallback.to]);
              }
            }
          } else {
            const fallback = playFallbackReply(next);
            if (fallback) {
              setLastEngineMove([fallback.from, fallback.to]);
            }
          }
        } catch {
          if (computerTaskIdRef.current !== taskId) return;
          const fallback = playFallbackReply(next);
          if (fallback) {
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
  }, [analyzeFen, analysisDepth, game, hasStarted, isReady, moveDelay, playerColor, setComputerThinking]);

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
      const opponentReplySan = uciToSan(afterPlayerMove, afterAnalysis.bestMove);
      const engineBestMoveSan = uciToSan(before, beforeAnalysis.bestMove) ?? suggestedMovesBefore[0];

      setCurrentEvaluation(afterAnalysis.evaluation);
      setCoachText(
        explainMove({
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
        }),
      );

      if (!afterPlayerMove.isGameOver()) {
        await delay(moveDelay);
        if (afterAnalysis.bestMove) {
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
        const fallback = playFallbackReply(afterPlayerMove);
        if (fallback) {
          setLastEngineMove([fallback.from, fallback.to]);
        }
      }

      setCoachText(
        explainMove({
          move,
          before,
          after: afterPlayerMove,
          history: before.history(),
          historyVerbose: before.history({ verbose: true }) as Move[],
          playerColor,
        }),
      );
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
    setPlayerSideChoice(nextChoice);
    setPlayerColor(previewColor);
    setHasStarted(false);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getSetupCoach(nextChoice));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setIsPreparingCoach(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function startGame() {
    cancelPendingComputerMove();
    const nextPlayerColor = resolvePlayerColor(playerSideChoice);
    coachFenRef.current = '';
    computerFenRef.current = '';
    lastSpokenMessageRef.current = '';
    setPlayerColor(nextPlayerColor);
    setHasStarted(true);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getPendingCoach(nextPlayerColor));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setIsPreparingCoach(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  return (
    <main className="page">
      <section className="boardColumn">
        <div className="hero">
          <p className="eyebrow">Skaktræning på dansk</p>
          <h1>SkakCoach</h1>
          <p className="intro">
            Vælg side, indstil tempo og tryk Start parti, når du er klar til at spille mod
            computeren.
          </p>
        </div>

        <div className="boardPanel">
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
          </div>
        </div>
      </section>

      <aside className="sideColumn">
        <GameInfo
          game={game}
          hasStarted={hasStarted}
          isReady={isReady}
          isComputerThinking={isComputerThinking}
          playerColor={playerColor}
          sideChoice={playerSideChoice}
          onSideChange={prepareGame}
          onStartGame={startGame}
        />
        <CoachPanel
          explanation={coachText}
          preMoveCoach={preMoveCoach}
          isPreparing={isPreparingCoach}
          voiceSupported={voiceSupported}
          onReadAloud={handleReadCoachAloud}
        />
        <EvalBar evaluation={currentEvaluation} visible={showEvalBar} />
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
        <MoveHistory moves={game.history()} />
      </aside>
    </main>
  );
}
