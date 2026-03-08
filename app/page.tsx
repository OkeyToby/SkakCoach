'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
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
  advantage: 'Spil dit første træk og prøv at sætte en officer i gang.',
  drawback: 'Ingen vurdering endnu.',
  betterMove: 'Kæmp gerne om centrum tidligt og tænk på rokade.',
};

function resolvePlayerColor(choice: PlayerSideChoice): Color {
  if (choice === 'random') {
    return Math.random() < 0.5 ? 'w' : 'b';
  }

  return choice === 'white' ? 'w' : 'b';
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
    plan: 'Start et nyt parti for at få nye forslag fra coachen.',
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
    typeof candidate.showCoordinates === 'boolean'
  );
}

export default function Page() {
  const [game, setGame] = useState(() => new Chess());
  const [coachText, setCoachText] = useState<MoveExplanation>(defaultExplanation);
  const [preMoveCoach, setPreMoveCoach] = useState<PreMoveCoach>(() => getPendingCoach('w'));
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
  const settingsLoadedRef = useRef(false);
  const coachFenRef = useRef('');
  const computerFenRef = useRef('');
  const { analyzeFen, isReady } = useEngine();

  const boardTheme = boardThemes[theme];
  const analysisDepth = difficultyDepth[difficulty];
  const moveDelay = tempoDelay[tempo];
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
    } catch {
      // Ignore malformed local settings and keep defaults.
    } finally {
      settingsLoadedRef.current = true;
    }
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
      } satisfies StoredSettings),
    );
  }, [difficulty, showCoordinates, showEvalBar, tempo, theme]);

  useEffect(() => {
    if (!isReady || isComputerThinking) return;

    const currentFen = game.fen();

    if (game.isGameOver()) {
      setIsPreparingCoach(false);
      setPreMoveCoach(getGameOverCoach());
      coachFenRef.current = currentFen;
      computerFenRef.current = '';
      return;
    }

    if (game.turn() !== playerColor) {
      if (computerFenRef.current === currentFen) return;

      let cancelled = false;
      computerFenRef.current = currentFen;
      coachFenRef.current = '';
      setIsPreparingCoach(false);
      setIsComputerThinking(true);
      setPreMoveCoach(getComputerThinkingCoach());

      void (async () => {
        const next = new Chess(currentFen);

        try {
          const analysis = await analyzeFen(currentFen, analysisDepth);
          if (cancelled) return;

          if (analysis.bestMove) {
            await delay(moveDelay);
            if (cancelled) return;
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
          if (cancelled) return;
          const fallback = playFallbackReply(next);
          if (fallback) {
            setLastEngineMove([fallback.from, fallback.to]);
          }
        } finally {
          if (!cancelled) {
            computerFenRef.current = '';
            setGame(new Chess(next.fen()));
            setIsComputerThinking(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
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
  }, [analyzeFen, analysisDepth, game, isComputerThinking, isReady, moveDelay, playerColor]);

  async function onPlayerMove(from: string, to: string) {
    if (!isReady || isComputerThinking || game.turn() !== playerColor || game.isGameOver()) {
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

    setGame(new Chess(afterPlayerMove.fen()));
    setIsPreparingCoach(false);
    setIsComputerThinking(true);
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
      const opponentReplySan = uciToSan(afterPlayerMove, afterAnalysis.bestMove);

      setCurrentEvaluation(afterAnalysis.evaluation);
      setCoachText(
        explainMove({
          move,
          before,
          after: afterPlayerMove,
          history: before.history(),
          historyVerbose: before.history({ verbose: true }) as Move[],
          playerColor,
          engineBestMoveSan: extractSuggestedMoves(before.fen(), beforeAnalysis.topMoves)[0],
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

      setGame(new Chess(afterPlayerMove.fen()));
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
      setGame(new Chess(afterPlayerMove.fen()));
      return true;
    } finally {
      setIsComputerThinking(false);
    }
  }

  function startNewGame(nextChoice = playerSideChoice) {
    const nextPlayerColor = resolvePlayerColor(nextChoice);
    coachFenRef.current = '';
    computerFenRef.current = '';
    setPlayerSideChoice(nextChoice);
    setPlayerColor(nextPlayerColor);
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setPreMoveCoach(getPendingCoach(nextPlayerColor));
    setCurrentEvaluation(null);
    setLastEngineMove(null);
    setIsPreparingCoach(false);
    setIsComputerThinking(false);
  }

  return (
    <main className="page">
      <section className="boardColumn">
        <div className="hero">
          <p className="eyebrow">Skaktræning på dansk</p>
          <h1>SkakCoach</h1>
          <p className="intro">
            Spil som hvid, sort eller tilfældigt mod computeren, få forslag før dit træk og se
            tydeligt, hvad motoren svarer.
          </p>
        </div>

        <div className="boardPanel">
          <ChessBoard
            position={game.fen()}
            onMove={onPlayerMove}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
            disabled={!isReady || isComputerThinking || game.turn() !== playerColor || game.isGameOver()}
            darkSquareColor={boardTheme.dark}
            lightSquareColor={boardTheme.light}
            customSquareStyles={lastEngineMoveStyles}
            showBoardNotation={showCoordinates}
          />

          <div className="boardMeta">
            <button className="resetBtn" onClick={() => startNewGame()} type="button">
              Nyt parti
            </button>
            {!isReady && <p className="statusNote">Stockfish starter…</p>}
            {isComputerThinking && <p className="thinking">Computeren tænker…</p>}
          </div>
        </div>
      </section>

      <aside className="sideColumn">
        <EvalBar evaluation={currentEvaluation} visible={showEvalBar} />
        <GameInfo
          game={game}
          playerColor={playerColor}
          sideChoice={playerSideChoice}
          onSideChange={startNewGame}
        />
        <SettingsPanel
          difficulty={difficulty}
          tempo={tempo}
          theme={theme}
          showEvalBar={showEvalBar}
          showCoordinates={showCoordinates}
          onDifficultyChange={setDifficulty}
          onTempoChange={setTempo}
          onThemeChange={setTheme}
          onShowEvalBarChange={setShowEvalBar}
          onShowCoordinatesChange={setShowCoordinates}
        />
        <CoachPanel
          explanation={coachText}
          preMoveCoach={preMoveCoach}
          isPreparing={isPreparingCoach}
        />
        <MoveHistory moves={game.history()} />
      </aside>
    </main>
  );
}
