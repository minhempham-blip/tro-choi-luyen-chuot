import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Sparkles, Volume2 } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface PianoKey {
  id: number;
  note: string;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  animalEmoji: string;
  animalName: string;
  chimeIndex: number;
}

const PIANO_KEYS: PianoKey[] = [
  { id: 0, note: 'Đồ', name: 'C', color: 'from-rose-400 to-red-500', borderColor: 'border-red-600', textColor: 'text-red-950', animalEmoji: '🐶', animalName: 'Cún Vui Vẻ', chimeIndex: 0 },
  { id: 1, note: 'Rê', name: 'D', color: 'from-orange-400 to-amber-500', borderColor: 'border-amber-600', textColor: 'text-amber-950', animalEmoji: '🐱', animalName: 'Mèo Tinh Nghịch', chimeIndex: 1 },
  { id: 2, note: 'Mi', name: 'E', color: 'from-yellow-300 to-amber-400', borderColor: 'border-yellow-600', textColor: 'text-yellow-950', animalEmoji: '🐰', animalName: 'Thỏ Trắng', chimeIndex: 2 },
  { id: 3, note: 'Pha', name: 'F', color: 'from-emerald-400 to-green-500', borderColor: 'border-green-600', textColor: 'text-green-950', animalEmoji: '🐸', animalName: 'Ếch Ca Sĩ', chimeIndex: 3 },
  { id: 4, note: 'Son', name: 'G', color: 'from-cyan-400 to-sky-500', borderColor: 'border-sky-600', textColor: 'text-sky-950', animalEmoji: '🐼', animalName: 'Gấu Trúc', chimeIndex: 4 },
  { id: 5, note: 'La', name: 'A', color: 'from-indigo-400 to-blue-500', borderColor: 'border-blue-600', textColor: 'text-blue-950', animalEmoji: '🐿️', animalName: 'Sóc Nhanh Nhẹn', chimeIndex: 5 },
  { id: 6, note: 'Si', name: 'B', color: 'from-purple-400 to-violet-500', borderColor: 'border-purple-600', textColor: 'text-purple-950', animalEmoji: '🐦', animalName: 'Họa Mi', chimeIndex: 6 },
  { id: 7, note: 'Đố', name: 'C2', color: 'from-pink-400 to-rose-500', borderColor: 'border-rose-600', textColor: 'text-pink-950', animalEmoji: '🦌', animalName: 'Hươu Tinh Tú', chimeIndex: 7 },
];

interface FloatingNote {
  id: number;
  x: number;
  y: number;
  emoji: string;
  text?: string;
  color: string;
}

export const MagicMelodyGame: React.FC<GameComponentProps> = ({
  level = 1,
  round = 1,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  // Active keys pool based on level
  const activeKeysCount = useMemo(() => {
    if (easyMode) return 4;
    if (level === 1) return 4;
    if (level === 2) return 6;
    return 8;
  }, [level, easyMode]);

  const availableKeys = useMemo(() => {
    return PIANO_KEYS.slice(0, activeKeysCount);
  }, [activeKeysCount]);

  // Target notes count per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 5 : 7;
    if (level === 2) return round === 1 ? 8 : 10;
    return round === 1 ? 12 : 14;
  }, [level, round, easyMode]);

  // Melody Sequence generation
  const melodySequence = useMemo(() => {
    const seq: number[] = [];
    const maxKey = activeKeysCount;

    // Create melodic step patterns that sound pleasing
    let lastKey = 0;
    for (let i = 0; i < targetRequired; i++) {
      if (i === 0) {
        lastKey = 0;
      } else {
        // Step up, down, or stay close
        const step = Math.random() < 0.6 ? (Math.random() < 0.5 ? 1 : -1) : Math.floor(Math.random() * maxKey) - lastKey;
        lastKey = Math.max(0, Math.min(maxKey - 1, lastKey + step));
      }
      seq.push(lastKey);
    }
    return seq;
  }, [activeKeysCount, targetRequired]);

  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [pressedKeyId, setPressedKeyId] = useState<number | null>(null);
  const [wigglingKeyId, setWigglingKeyId] = useState<number | null>(null);
  const [dancingAnimalId, setDancingAnimalId] = useState<number | null>(null);
  const [floatingNotes, setFloatingNotes] = useState<FloatingNote[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{ x: number; y: number; active: boolean; clicking: boolean }>({
    x: 50,
    y: 50,
    active: false,
    clicking: false,
  });

  // Current expected key
  const expectedKeyIndex = melodySequence[currentStep] ?? 0;
  const expectedKey = availableKeys[expectedKeyIndex] ?? availableKeys[0];

  // Initialize round state
  useEffect(() => {
    finishedRef.current = false;
    setCurrentStep(0);
    setScore(0);
    setCombo(0);
    setMistakes(0);
    setFloatingNotes([]);
    setPressedKeyId(null);
    setDancingAnimalId(null);
  }, [level, round, melodySequence]);

  // Clean up floating notes
  useEffect(() => {
    if (floatingNotes.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingNotes((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [floatingNotes]);

  // Tier 3 Ghost Cursor Demo loop
  useEffect(() => {
    if (currentHintTier < 3 || finishedRef.current) {
      setGhostCursor((g) => ({ ...g, active: false }));
      return;
    }

    const keyIndex = expectedKeyIndex;
    const keyPercentX = ((keyIndex + 0.5) / activeKeysCount) * 100;
    const keyPercentY = 65;

    let isCancelled = false;
    setGhostCursor({ x: 50, y: 30, active: true, clicking: false });

    const timeout1 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: keyPercentX, y: keyPercentY, active: true, clicking: false });
    }, 500);

    const timeout2 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: keyPercentX, y: keyPercentY, active: true, clicking: true });
      audioEngine.playStarChime(expectedKey.chimeIndex);
    }, 1200);

    const timeout3 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor((g) => ({ ...g, active: false }));
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [currentHintTier, expectedKeyIndex, activeKeysCount, expectedKey]);

  // Trigger floating musical particles
  const spawnFloatingNote = (keyIndex: number, text?: string) => {
    const keyPercentX = ((keyIndex + 0.5) / activeKeysCount) * 100;
    const emojis = ['🎵', '🎶', '⭐', '✨', '💖'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    setFloatingNotes((prev) => [
      ...prev,
      {
        id: Math.random(),
        x: keyPercentX,
        y: 50,
        emoji,
        text,
        color: 'text-amber-500 font-black',
      },
    ]);
  };

  // Handle clicking on a piano key
  const handleKeyClick = (key: PianoKey) => {
    if (finishedRef.current) return;

    // Visual press animation
    setPressedKeyId(key.id);
    setTimeout(() => setPressedKeyId(null), 250);

    if (key.id !== expectedKey.id) {
      // Wrong Key Clicked!
      audioEngine.playError();
      onMistake();
      setMistakes((m) => m + 1);
      setCombo(0);

      setWigglingKeyId(key.id);
      setTimeout(() => setWigglingKeyId(null), 450);

      spawnFloatingNote(key.id, 'Sai nốt rồi!');
      return;
    }

    // Correct Key Hit!
    audioEngine.playPop();
    audioEngine.playStarChime(key.chimeIndex);
    onSuccess();

    setDancingAnimalId(key.id);
    setTimeout(() => setDancingAnimalId(null), 500);

    const newCombo = combo + 1;
    setCombo(newCombo);

    const bonus = Math.min(newCombo * 20, 100);
    const addedScore = 100 + bonus;
    setScore((s) => s + addedScore);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onProgress?.(nextStep, targetRequired);

    const praiseList = ['Nốt hay quá!', 'Tuyệt vời!', 'Du dương!', 'Đúng nhịp!'];
    const praise = newCombo > 2 ? `Combo x${newCombo}! ${praiseList[newCombo % praiseList.length]}` : key.note;
    spawnFloatingNote(key.id, praise);

    // Check completion condition
    if (nextStep >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playSuccess();
      audioEngine.playFanfare();

      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const totalClicks = nextStep + mistakes;
      const accuracy = Math.max(50, Math.round((nextStep / Math.max(1, totalClicks)) * 100));
      const stars = Math.min(10, Math.max(5, 11 - Math.floor(mistakes / 2)));
      const finalScore = score + addedScore + Math.max(0, 350 - timeTaken * 6);

      setTimeout(() => {
        onComplete({
          gameId: 9,
          level,
          round,
          score: finalScore,
          stars,
          accuracy,
          timeTakenSeconds: timeTaken,
          correctCount: nextStep,
          mistakeCount: mistakes,
        });
      }, 700);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 select-none p-4"
    >
      {/* Decorative Stage Lighting & Sparkles */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-10 left-1/4 h-64 w-64 rounded-full bg-pink-500 blur-3xl" />
        <div className="absolute -top-10 right-1/4 h-64 w-64 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-amber-400 blur-3xl" />
      </div>

      {/* TOP BANNER: Orchestra Conductor Header */}
      <div className="relative z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-xl border-2 border-purple-300">
        {/* Conductor Mascot Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
            <span className="text-2xl sm:text-3xl">🎼</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Màn {level} • Vòng {round}
              </span>
              {combo > 1 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-bounce">
                  ⚡ Nhịp x{combo}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">
              Hòa Nhạc Rừng Xanh – Bản Giao Hưởng Tí Hon
            </h2>
          </div>
        </div>

        {/* Current Target Note & Progress */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-purple-100 px-3 py-1.5 border border-purple-300">
            <span className="text-xs font-bold text-purple-900">Bấm nốt:</span>
            <span className="rounded-lg bg-purple-600 px-2 py-0.5 text-xs sm:text-sm font-black text-white shadow-sm flex items-center gap-1">
              <span>{expectedKey.animalEmoji}</span>
              <span>{expectedKey.note}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 px-3 py-1.5 font-black text-white shadow-sm text-xs sm:text-sm">
            <span>🎵</span>
            <span>
              {currentStep} / {targetRequired}
            </span>
          </div>
        </div>
      </div>

      {/* TIER 2 HINT BUBBLE: Mascot dialogue */}
      {currentHintTier === 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2 shadow-xl border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm animate-pulse"
        >
          <span>💡</span>
          <span>
            Bé hãy nháy chuột trái vào phím nốt <span className="underline">{expectedKey.note}</span> ({expectedKey.animalEmoji} {expectedKey.animalName}) đang phát sáng nhé!
          </span>
        </motion.div>
      )}

      {/* PLAYFIELD: Melody Sheet & Rainbow Animal Piano */}
      <div className="relative h-[80%] w-full overflow-hidden rounded-2xl mt-3 flex flex-col justify-between items-center bg-gradient-to-b from-indigo-950/80 via-purple-950/70 to-slate-900/90 shadow-2xl border border-purple-500/40 p-4">
        {/* Floating Musical Notes */}
        {floatingNotes.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: 1.25 }}
            exit={{ opacity: 0 }}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            className={`pointer-events-none absolute z-40 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 shadow-xl text-xs sm:text-sm border border-purple-200 flex items-center gap-1 ${f.color}`}
          >
            <span>{f.emoji}</span>
            {f.text && <span>{f.text}</span>}
          </motion.div>
        ))}

        {/* TOP: Interactive Melody Sheet Staff */}
        <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900/80 p-3 border-2 border-purple-400/50 shadow-inner backdrop-blur-xs flex flex-col items-center">
          <div className="flex items-center justify-between w-full px-2 mb-1">
            <span className="text-[11px] font-extrabold text-purple-200 flex items-center gap-1">
              <Music className="h-3.5 w-3.5 text-pink-400" />
              Khuông nhạc giai điệu (Nháy đúng thứ tự):
            </span>
            <span className="text-[10px] font-bold text-amber-300">
              Đã gõ: {currentStep}/{targetRequired} nốt
            </span>
          </div>

          {/* Note Bubbles Sequence Bar */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto py-1 max-w-full">
            {melodySequence.map((keyIdx, index) => {
              const k = availableKeys[keyIdx] ?? availableKeys[0];
              const isPast = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={index}
                  animate={isCurrent ? { scale: [1, 1.2, 1], y: [-2, 2, -2] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`relative flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all ${
                    isPast
                      ? 'bg-emerald-600/70 border border-emerald-400 text-white opacity-80'
                      : isCurrent
                      ? 'bg-amber-400 border-2 border-white text-amber-950 font-black shadow-lg ring-4 ring-amber-400/50 scale-110'
                      : 'bg-slate-800/80 border border-slate-600 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-xs sm:text-base">{k.animalEmoji}</span>
                  <span className="text-[10px] font-bold">{k.note}</span>
                  {isCurrent && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white font-black animate-ping">
                      ★
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM: Rainbow Animal Piano Keyboard */}
        <div className="relative w-full max-w-4xl flex items-end justify-center gap-1.5 sm:gap-3 px-2 pt-4 pb-2">
          {availableKeys.map((key) => {
            const isTarget = key.id === expectedKey.id;
            const isPressed = pressedKeyId === key.id;
            const isWiggling = wigglingKeyId === key.id;
            const isDancing = dancingAnimalId === key.id;
            const isHinted = currentHintTier >= 1 && isTarget;

            return (
              <div key={key.id} className="relative flex-1 flex flex-col items-center">
                {/* Animal Mascot Performer above key */}
                <motion.div
                  animate={
                    isDancing
                      ? { y: [-24, 0, -12, 0], scale: [1, 1.35, 1], rotate: [-10, 10, 0] }
                      : isTarget
                      ? { y: [-4, 4, -4] }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: isTarget && !isDancing ? Infinity : 0 }}
                  className="mb-1 flex flex-col items-center cursor-pointer pointer-events-none"
                >
                  <span className="text-3xl sm:text-5xl filter drop-shadow-md">
                    {key.animalEmoji}
                  </span>
                  <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-200 hidden sm:block whitespace-nowrap">
                    {key.animalName}
                  </span>
                </motion.div>

                {/* Piano Key Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  animate={
                    isWiggling
                      ? { x: [-8, 8, -6, 6, 0] }
                      : isTarget
                      ? { y: [0, -4, 0] }
                      : {}
                  }
                  transition={{
                    x: { duration: 0.35 },
                    y: { repeat: Infinity, duration: 1.2 },
                  }}
                  onClick={() => handleKeyClick(key)}
                  className={`group relative w-full h-36 sm:h-48 rounded-2xl bg-gradient-to-b ${key.color} border-4 ${key.borderColor} shadow-2xl flex flex-col items-center justify-between p-2 cursor-pointer transition-all ${
                    isPressed ? 'translate-y-2 shadow-inner brightness-125' : ''
                  } ${
                    isHinted
                      ? 'ring-4 ring-amber-300 ring-offset-4 ring-offset-purple-900 animate-pulse'
                      : ''
                  }`}
                >
                  {/* Glowing Aura on Target Key */}
                  {isTarget && (
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse pointer-events-none" />
                  )}

                  {/* Sound Waves / Shimmer icon */}
                  <div className="flex items-center justify-center w-full">
                    {isTarget ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-purple-950 shadow-md animate-bounce">
                        Bấm đây!
                      </span>
                    ) : (
                      <Volume2 className="h-4 w-4 text-white/60 group-hover:text-white" />
                    )}
                  </div>

                  {/* Note label on Key Bottom */}
                  <div className="w-full text-center pb-2">
                    <span className="text-lg sm:text-2xl font-black text-white drop-shadow-md block">
                      {key.note}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-widest block">
                      Phím {key.name}
                    </span>
                  </div>

                  {/* TIER 1 HINT: Pointing finger directly over key */}
                  {isHinted && (
                    <motion.div
                      animate={{ y: [-8, 4, -8] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-40"
                    >
                      <span className="text-3xl filter drop-shadow">👇</span>
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-amber-950 shadow-md whitespace-nowrap">
                        Nháy chuột trái!
                      </span>
                    </motion.div>
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* TIER 3 HINT: Ghost Mouse Cursor Demonstration */}
        {ghostCursor.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: `${ghostCursor.x}%`,
              top: `${ghostCursor.y}%`,
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute z-50 -translate-x-2 -translate-y-2"
          >
            <div className="relative">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                <path
                  d="M3 3L10.07 19.97L12.58 13.58L19.97 10.07L3 3Z"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              {ghostCursor.clicking && (
                <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 font-black text-xs text-rose-900 animate-ping">
                  Click!
                </span>
              )}
            </div>
            <div className="whitespace-nowrap rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              Mẫu: Nháy chuột trái vào phím đàn
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM FOOTER: Hint and Accuracy Tracker */}
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-purple-200">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-900/80 px-2.5 py-1 font-bold text-purple-200 border border-purple-500">
            🎼 Bản giao hưởng rừng xanh: {currentStep}/{targetRequired} nốt
          </span>
          {mistakes > 0 && (
            <span className="rounded-full bg-rose-950/80 px-2.5 py-1 font-bold text-rose-300 border border-rose-600">
              Bấm nhầm: {mistakes} lần (Thử lại nhé!)
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-bold text-amber-300 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-500/50">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Thao tác: Nháy chuột trái vào phím nốt nhạc phát sáng theo nhịp điệu!</span>
        </div>
      </div>
    </div>
  );
};
