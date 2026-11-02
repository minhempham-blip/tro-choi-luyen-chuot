import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Layers,
  Star,
} from 'lucide-react';
import { GameMetadata, GameResult, AppSettings, StudentProfile } from '../../state/types';
import { GAME_COMPONENTS } from '../../games/gameRegistry';
import { StarRating } from '../common/StarRating';
import { TutorialModal } from '../common/TutorialModal';
import { VictoryModal } from '../common/VictoryModal';
import { HintSystem } from '../common/HintSystem';
import { Mascot } from '../common/Mascot';
import { audioEngine } from '../../audio/audioEngine';
import { StorageService } from '../../state/storage';

interface GameShellProps {
  game: GameMetadata;
  student: StudentProfile;
  settings: AppSettings;
  onBackToMenu: () => void;
  onNextGame?: () => void;
  onUpdateStudent: (student: StudentProfile) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleSpeech: () => void;
}

export const GameShell: React.FC<GameShellProps> = ({
  game,
  student,
  settings,
  onBackToMenu,
  onNextGame,
  onUpdateStudent,
  onToggleSound,
  onToggleMusic,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [round, setRound] = useState<1 | 2>(1);
  const [sessionId, setSessionId] = useState<number>(1);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPractice, setIsPractice] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [consecutiveMistakes, setConsecutiveMistakes] = useState(0);
  const [currentHintTier, setCurrentHintTier] = useState<0 | 1 | 2 | 3>(0);
  const [mascotBubble, setMascotBubble] = useState<string | null>(null);

  const inactivityTimerRef = useRef<number | null>(null);
  const GameComponent = GAME_COMPONENTS[game.id];

  // Inactivity tracking (6 seconds)
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (currentHintTier === 1) setCurrentHintTier(0);

    inactivityTimerRef.current = window.setTimeout(() => {
      // Auto trigger Tier 1 hint after 6s
      setCurrentHintTier(1);
    }, 6000);
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [game.id, level, round, sessionId, showTutorial]);

  const handleStartGame = (practice: boolean) => {
    setIsPractice(practice);
    setShowTutorial(false);
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleMistake = () => {
    resetInactivityTimer();
    const newMistakes = consecutiveMistakes + 1;
    setConsecutiveMistakes(newMistakes);

    if (newMistakes >= 3) {
      // Trigger Tier 3 Demo Ghost Cursor!
      setCurrentHintTier(3);
      setMascotBubble(game.hintTiers.tier3);
      setTimeout(() => {
        setCurrentHintTier(0);
        setMascotBubble(null);
        setConsecutiveMistakes(0);
      }, 4500);
    } else {
      setMascotBubble('Thử lại nhé, bé quan sát kỹ hơn nào!');
      setTimeout(() => setMascotBubble(null), 2500);
    }
  };

  const handleSuccess = () => {
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    resetInactivityTimer();
    const praises = ['Giỏi quá!', 'Tuyệt vời!', 'Chính xác rồi!', 'Bé khéo lắm!'];
    const praise = praises[Math.floor(Math.random() * praises.length)];
    setMascotBubble(praise);
    setTimeout(() => setMascotBubble(null), 1800);
  };

  const handleGameComplete = (result: GameResult) => {
    const fullResult: GameResult = {
      ...result,
      level,
      round,
    };
    if (!isPractice) {
      const updated = StorageService.updateStudentProgress(student.id, game.id, fullResult.stars, fullResult.score);
      onUpdateStudent(updated);
    }
    setGameResult(fullResult);
  };

  const handleReplay = () => {
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleChangeLevel = (newLvl: 1 | 2 | 3) => {
    setLevel(newLvl);
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleChangeRound = (newRnd: 1 | 2) => {
    setRound(newRnd);
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleSelectLevelRound = (newLvl: 1 | 2 | 3, newRnd: 1 | 2) => {
    setLevel(newLvl);
    setRound(newRnd);
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleNextRoundOrLevel = () => {
    if (round === 1) {
      // Advance to round 2 of current level
      setRound(2);
    } else {
      // Completed round 2, advance to next level round 1
      if (level < 3) {
        setLevel((prev) => ((prev + 1) as 1 | 2 | 3));
        setRound(1);
      } else {
        // Finished Level 3 Round 2 -> Go to next game!
        onNextGame?.();
        return;
      }
    }
    setGameResult(null);
    setConsecutiveMistakes(0);
    setCurrentHintTier(0);
    setSessionId((s) => s + 1);
    resetInactivityTimer();
  };

  const handleManualHintClick = () => {
    audioEngine.playPop();
    setCurrentHintTier(2);
    setMascotBubble(game.hintTiers.tier2);
  };

  const currentStars = student.stars[game.id] || 0;

  return (
    <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-8 border-pink-400 bg-amber-50 shadow-2xl">
      {/* --- TOP BAR --- */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b-4 border-pink-300 bg-white/95 px-3 sm:px-4 py-2 shadow-sm">
        {/* Left Section: Back button and Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onBackToMenu();
            }}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-200 px-3 py-1.5 text-xs sm:text-sm font-extrabold text-amber-950 shadow-sm hover:bg-amber-300 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Về Menu
          </button>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-base font-black text-blue-900">
                Bài {game.id}: {game.title}
              </span>
              <span className="hidden sm:inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {game.actionLabel}
              </span>
            </div>
            {/* Stars Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating stars={currentStars} maxStars={10} size="sm" />
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-600">
                ({currentStars}/10 sao)
              </span>
            </div>
          </div>
        </div>

        {/* Center: LEVEL (DỄ, VỪA, KHÓ) & ROUND (VÒNG 1, VÒNG 2) SELECTORS */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Level Switcher */}
          <div className="flex items-center gap-1 rounded-2xl bg-amber-100/80 p-1 border border-amber-300 shadow-inner">
            <span className="text-[10px] font-black text-amber-900 px-1 hidden md:inline uppercase">
              Màn:
            </span>
            {(
              [
                { lvl: 1, label: 'Dễ', stars: '⭐' },
                { lvl: 2, label: 'Vừa', stars: '⭐⭐' },
                { lvl: 3, label: 'Khó', stars: '⭐⭐⭐' },
              ] as const
            ).map((item) => (
              <button
                key={item.lvl}
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  handleChangeLevel(item.lvl);
                }}
                className={`rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                  level === item.lvl
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'text-slate-700 hover:bg-white/80 hover:text-blue-900'
                }`}
                title={`Màn ${item.label} (${item.stars})`}
              >
                <span>{item.label}</span>
                <span className="ml-1 text-[9px] opacity-80">{item.stars}</span>
              </button>
            ))}
          </div>

          {/* Round Switcher (2 Vòng) */}
          <div className="flex items-center gap-1 rounded-2xl bg-indigo-100/80 p-1 border border-indigo-300 shadow-inner">
            <span className="text-[10px] font-black text-indigo-900 px-1 hidden md:inline uppercase">
              Vòng:
            </span>
            {(
              [
                { rnd: 1, label: 'Vòng 1' },
                { rnd: 2, label: 'Vòng 2' },
              ] as const
            ).map((item) => (
              <button
                key={item.rnd}
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  handleChangeRound(item.rnd);
                }}
                className={`rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                  round === item.rnd
                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                    : 'text-slate-700 hover:bg-white/80 hover:text-indigo-900'
                }`}
                title={`Chơi ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Replay current round button */}
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              handleReplay();
            }}
            className="rounded-xl bg-slate-100 hover:bg-amber-100 p-1.5 text-slate-700 border border-slate-300 transition-all cursor-pointer active:scale-95"
            title="Làm mới vòng này"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Right Section: Toggles & Hint Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`rounded-xl p-2 transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
            title={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Music BGM Toggle */}
          <button
            type="button"
            onClick={onToggleMusic}
            className={`rounded-xl p-2 transition-colors cursor-pointer ${
              settings.musicEnabled
                ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
            title={settings.musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          >
            <Music className="h-4 w-4" />
          </button>

          {/* HINT BUTTON (Tier 2) */}
          <button
            type="button"
            onClick={handleManualHintClick}
            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-xs sm:text-sm font-black text-amber-950 shadow-md hover:from-amber-500 hover:to-yellow-600 active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Gợi ý</span>
          </button>
        </div>
      </header>

      {/* Practice mode banner */}
      {isPractice && (
        <div className="z-10 bg-amber-400 px-4 py-1 text-center text-xs font-black text-amber-950 shadow-xs">
          Đang ở chế độ: CHƠI THỬ (Không tính điểm) · Bé cứ tự do làm quen thao tác nhé!
        </div>
      )}

      {/* --- GAME CANVAS CONTAINER --- */}
      <main className="relative flex-1 overflow-hidden p-2 sm:p-3">
        {GameComponent && (
          <GameComponent
            key={`${game.id}-lvl-${level}-rnd-${round}-s-${sessionId}`}
            level={level}
            round={round}
            isPractice={isPractice}
            easyMode={settings.easyMode}
            currentHintTier={currentHintTier}
            onMistake={handleMistake}
            onSuccess={handleSuccess}
            onComplete={handleGameComplete}
          />
        )}

        {/* 3-Tier Hint Overlay */}
        <HintSystem
          currentTier={currentHintTier}
          hintText={
            currentHintTier === 3
              ? game.hintTiers.tier3
              : currentHintTier === 2
              ? game.hintTiers.tier2
              : game.hintTiers.tier1
          }
          targetCoords={null}
          onDismissTier2={() => {
            setCurrentHintTier(0);
            setMascotBubble(null);
          }}
        />

        {/* Mascot companion cheering on bottom-left */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-30">
          <Mascot
            character="tiger"
            state={mascotBubble ? 'happy' : 'idle'}
            size="sm"
            bubbleText={mascotBubble || undefined}
            className="pointer-events-auto"
          />
        </div>
      </main>

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal
          game={game}
          selectedLevel={level}
          selectedRound={round}
          onSelectLevel={handleChangeLevel}
          onSelectRound={handleChangeRound}
          onStart={handleStartGame}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Result Modal with 2 Rounds & 3 Levels progression */}
      {gameResult && (
        <VictoryModal
          result={gameResult}
          currentLevel={level}
          currentRound={round}
          hasNextGame={game.id < 20}
          onReplay={handleReplay}
          onNextRoundOrLevel={handleNextRoundOrLevel}
          onSelectLevelRound={handleSelectLevelRound}
          onNextGame={() => {
            setGameResult(null);
            onNextGame?.();
          }}
          onHome={() => {
            setGameResult(null);
            onBackToMenu();
          }}
        />
      )}
    </div>
  );
};
